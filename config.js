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
  "redis": {
    tiptap: {
      port: parseInt(process.env.REDIS_PORT || 6379),
      host: (process.env.REDIS_HOST || 'localhost'),
      password: (process.env.REDIS_PASSWORD || undefined),
      db: 1
    },
    records:{
      port: parseInt(process.env.REDIS_PORT || 6379),
      host: (process.env.REDIS_HOST || 'localhost'),
      password: (process.env.REDIS_PASSWORD || undefined),
      db: 2
    }
  }
}

module.exports = config
