'use strict';

const Schema = require('./schema.js')
const Step = require('prosemirror-transform').Step
const config = require('./config.js')

let
  redis = require('redis'),
  redisClient = redis.createClient({ port: 6379, host: 'localhost' })

redisClient.on("error", function(err) {
  console.error("redisClient", err)
});


var events = function(socket) {
  const channel = socket.nsp.name
  console.log("channel: ", channel)

  socket.on('update', async ({ version, clientID, steps, participant}) => {
    redisClient.get(channel+":doc", function(err, val) {
      if (err) { console.log("update error", err); return }
      var storedData = (val && JSON.parse(val)) || config.defaultData

      console.log("update, document is:", storedData)

      if (storedData.version !== version) {
        console.log("storedData.version !== version; resending steps", version)
        redisClient.lrange(channel+":steps", 0, -1, function(err, val) {
          if (err) { console.error(err); return }
          let allSteps =  JSON.parse(val) || []
          console.log("all steps: ", allSteps)
          console.log("emitting update", {
            version: version,
            steps: allSteps.filter(step => {step.version > version}),
            clientID: clientID
          })

          socket.emit('update', {
            version: version,
            steps: allSteps.filter(step => {step.version > version}),
            clientID: clientID
          })
        })
        return
      }

      let doc = Schema.nodeFromJSON(storedData.doc)

      let newSteps = steps.map(step => {
        const newStep = Step.fromJSON(Schema, step)
        newStep.clientID = socket.id
        let result = newStep.apply(doc)
        doc = result.doc
        return newStep
      })


      // calculating a new version number is easy)
      const newVersion = version + newSteps.length
      console.log("newVersion:", newVersion)

      newSteps = steps.map((step, index) => {
        return {
          step: JSON.parse(JSON.stringify(step)),
          version: newVersion + index + 1,
          clientID: socket.id,
        }
      })


      newSteps.forEach(step => {
        redisClient.rpush(channel+":steps", JSON.stringify(step, null, 2))
      })

      redisClient.set(channel+":doc", JSON.stringify({version: newVersion, doc}, null, 2))

      console.log("newSteps:", newSteps)
      console.log("newDocument:", JSON.stringify({version: newVersion, doc}, null, 2))
      console.log("emitting:", 'update', {
        version: newVersion,
        steps: newSteps,
        clientID: socket.id
      })

      // send update to everyone (me and others)
      socket.nsp.emit('update', {
        version: newVersion,
        steps: newSteps,
        clientID: socket.id
      })
      return
    })
  })

  socket.on('disconnect', () => {
    console.log('main.disconnect')
    socket.nsp.emit('getCount', socket.server.engine.clientsCount)
  })

  redisClient.get(channel+":doc", function(err, value) {
    if (err) {
      console.log("init redis data error", err)
      return
    }
    console.log("init", (JSON.parse(value) || config.defaultData))
    socket.emit('init', (JSON.parse(value) || config.defaultData))
  })

  socket.nsp.emit('getCount', socket.server.engine.clientsCount)
}


module.exports = events
