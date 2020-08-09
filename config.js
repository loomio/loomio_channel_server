let allowedOrigins = '*:*'
let port = process.env.PORT || 5000
let defaultData = {
  "version": 0,
  "doc": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "new collaborative document"
          }
        ]
      }
    ]
  }
}

const config = {
	"port": port,
	"defaultData": defaultData,
	'allowedOrigins': allowedOrigins,
}

module.exports = config
