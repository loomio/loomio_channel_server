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
      cursorDecorations[socket.id]['clientID'] = socket.id

      redisClient.get(docPath, function(err, val) {
        if (err) { console.log("update doc error", err); return }

        var storedData = (val && JSON.parse(val)) || config.defaultData

        if (storedData.version !== version) {
          // infuture, store steps in sortedSet with score=version., then we don't need to retrieve them all to reply.
          // console.log("storedData.version !== version", storedData.version, version)
          redisClient.lrange(stepsPath, 0, -1, function(err, val) {
            if (err) { console.error(err); return }
            let allSteps = val.map((str) => JSON.parse(str))

            socket.emit('update', {
              version: version,
              steps: allSteps.filter(step => {step.version > version}),
              clientID: clientID,
              participants: cursorDecorations
            })
          })
          return
        }

        if (storedData.doc == null) {
          redisClient.del(docPath)
          redisClient.del(decorationsPath)
          redisClient.del(stepsPath)
          socket.nsp.emit('init', config.defaultData)
          return
        }

        let doc = Schema.nodeFromJSON(storedData.doc)

        let newSteps = steps.map(step => {
          const newStep = Step.fromJSON(Schema, step)
          newStep.clientID = socket.id

          for (var decoID in cursorDecorations) {
            if (socket.id == decoID) { continue; }
            var cursor = cursorDecorations[decoID].cursor
            if (cursor != undefined && newStep.slice != undefined && cursor > newStep.from) {
              var gap = newStep.from - newStep.to
              cursorDecorations[decoID].cursor = cursor+gap+newStep.slice.content.size
            }
          }

          let result = newStep.apply(doc)
          doc = result.doc
          return newStep
        })

        const newVersion = version + newSteps.length

        newSteps = steps.map((step, index) => {
          return {
            step: JSON.parse(JSON.stringify(step)),
            version: newVersion + index + 1,
            clientID: socket.id,
          }
        })

        newSteps.forEach(step => {
          redisClient.rpush(stepsPath, JSON.stringify(step))
        })

        redisClient.set(docPath, JSON.stringify({version: newVersion, doc}, null, 2))
        redisClient.set(decorationsPath, JSON.stringify(cursorDecorations, null, 2))

        // send update to everyone (me and others)
        socket.nsp.emit('update', {
          version: newVersion,
          steps: newSteps,
          clientID: socket.id,
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

      delete cursorDecorations[socket.id]
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
      cursorDecorations[socket.id]['clientID'] = socket.id
      socket.nsp.emit('cursorupdate', {participants: cursorDecorations})
      redisClient.set(decorationsPath, JSON.stringify(cursorDecorations, null, 2))
    })
  })

  socket.nsp.emit('getCount', socket.server.engine.clientsCount)
}

module.exports = events
