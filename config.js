let allowedOrigins = '*:*'
let port = process.env.PORT || 5000
let defaultData = {
  "version": 0,
  "doc": {
    "type": "doc",
    "content": [{"type": "paragraph"}]
  }
}

const config = {
	"port": port,
	"defaultData": defaultData,
	'allowedOrigins': allowedOrigins,
  "redis": (process.env.REDIS_URL || 'redis://localhost:6379')
}

module.exports = config
