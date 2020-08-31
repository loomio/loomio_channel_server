'use strict';

const Schema = require('./schema.js')
const Step = require('prosemirror-transform').Step
const config = require('./config.js')

const redis = require('redis')
const redisClient = redis.createClient(config.redis)

var events = function(socket) {

  const docPath = socket.nsp.name + ":doc"
  const stepsPath = socket.nsp.name + ":steps"
  const decorationsPath = socket.nsp.name + ":decorations"

  redisClient.get(docPath, function(err, value) {
    if (err) {
      console.log("init redis data error", err)
      return
    }
    console.log("init", (JSON.parse(value) || config.defaultData))
    socket.emit('init', (JSON.parse(value) || config.defaultData))
  })

  socket.on('update', async ({ version, clientID, steps, participant}) => {
    redisClient.get(decorationsPath, function(err, val) {
      if (err) { console.log("update decorations error", err); return }

      var cursorDecorations = (val && JSON.parse(val)) || {}

      cursorDecorations[socket.id] = participant

      redisClient.get(docPath, function(err, val) {
        if (err) { console.log("update doc error", err); return }

        var storedData = (val && JSON.parse(val)) || config.defaultData

        console.log("update", 'clientID', clientID, "serverversion:", storedData.version, 'clientVersion', version)
        // if (storedData.version !== version) {
        if (storedData.version > version) {
          console.log("storedData.version > version!")
          redisClient.zrangebyscore(stepsPath, version, "+inf", function(err, val) {
            if (err) { console.error(err); return }

            console.log("resending steps for version", version, val.map((str) => JSON.parse(str)))
            socket.emit('update', {
              version: version,
              steps: val.map((str) => JSON.parse(str)),
              clientID: clientID,
              participants: cursorDecorations
            })
          })
          return
        }

        if (storedData.doc == null) {
          console.log('doc is null')
          redisClient.del(docPath)
          redisClient.del(decorationsPath)
          redisClient.del(stepsPath)
          socket.nsp.emit('init', config.defaultData)
          return
        }

        let doc = Schema.nodeFromJSON(storedData.doc)
        // console.log("storedData.doc is ", doc)

        let newSteps = steps.map(step => {
          const newStep = Step.fromJSON(Schema, step)
          console.log("(newSteps) given client id, vs, recognised", newStep.clientID, clientID)
          newStep.clientID = clientID

          for (var socketID in cursorDecorations) {
            if (clientID == cursorDecorations[socketID].clientID) { continue; }
            var cursor = cursorDecorations[socketID].cursor
            if (cursor != undefined && newStep.slice != undefined && cursor > newStep.from) {
              var gap = newStep.from - newStep.to
              cursorDecorations[socketID].cursor = cursor+gap+newStep.slice.content.size
            }
          }

          let result = newStep.apply(doc)
          console.log("applied step to doc", "docVersion", storedData.version, "stepVersion", newStep.version)
          doc = result.doc
          return newStep
        })

        const newVersion = version + newSteps.length

        newSteps = steps.map((step, index) => {
          return {
            step: JSON.parse(JSON.stringify(step)),
            version: newVersion + index + 1,
            clientID: clientID,
          }
        })

        newSteps.forEach(step => {
          redisClient.zadd(stepsPath, step.version, JSON.stringify(step))
        })

        if (newSteps.length) {
          redisClient.zremrangebyscore(stepsPath, "-inf", (newSteps[newSteps.length - 1].version - 10000))
        }

        redisClient.set(docPath, JSON.stringify({version: newVersion, doc}, null, 2))
        redisClient.set(decorationsPath, JSON.stringify(cursorDecorations, null, 2))

        // send update to everyone (me and others)
        console.log("relaying out newsteps", newVersion, newSteps)
        socket.nsp.emit('update', {
          version: newVersion,
          steps: newSteps,
          clientID: clientID,
          participants: cursorDecorations
        })
      })
    })
  })

  socket.on('disconnect', () => {
    console.log('main.disconnect')
    socket.nsp.emit('getCount', socket.server.engine.clientsCount)

    redisClient.get(decorationsPath, function(err, val) {
      if (err) { console.log("update decorations error", err); return }
      var cursorDecorations = (val && JSON.parse(val)) || {}

      delete cursorDecorations[socket.id] //dodgy.. use participant.userId
      socket.nsp.emit('cursorupdate', {participants: cursorDecorations})
      redisClient.set(decorationsPath, JSON.stringify(cursorDecorations, null, 2))
    })
  })

  // Update collaborators about your cursor postition
  socket.on('cursorchange', async (participant) => {
    redisClient.get(decorationsPath, function(err, val) {
      if (err) { console.log("update decorations error", err); return }
      var cursorDecorations = (val && JSON.parse(val)) || {}

      cursorDecorations[socket.id] = participant
      socket.nsp.emit('cursorupdate', {participants: cursorDecorations})
      redisClient.set(decorationsPath, JSON.stringify(cursorDecorations, null, 2))
    })
  })

  socket.nsp.emit('getCount', socket.server.engine.clientsCount)
}

module.exports = events
