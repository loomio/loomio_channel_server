//import { Schema} from 'prosemirror-model'
const Schema = require('prosemirror-model').Schema
const tableNodes = require('prosemirror-tables').tableNodes
tables = tableNodes({
  tableGroup: 'block',
  cellContent: 'block+',
  cellAttributes: {
    background: {
      default: null,
      getFromDOM(dom) {
        return dom.style.backgroundColor || null
      },
      setDOMAttr(value, attrs) {
        if (value) {
          const style = { style: `${(attrs.style || '')}background-color: ${value};` }
          Object.assign(attrs, style)
        }
      },
    }
  }
})
const schema = {
  "nodes": {
    "table": tables.table,
    "table_cell": tables.table_cell,
    "table_header": tables.table_header,
    "table_row": tables.table_row,
    "todo_list": {
      group: 'block',
      content: 'todo_item+',
    },
    "iframe": {
      attrs: {
        src: { default: ''}
      },
      group: 'block',
      selectable: false
    },
    "todo_item": {
      attrs: {
        done: {
          default: false,
        },
      },
      draggable: true,
      content: 'paragraph+',
    },
    "doc": {
      "content": "block+"
    },
    "text": {
      "group": "inline"
    },
    "paragraph": {
      "attrs": {
        "textAlign": {
          default: null
        }
      },
      "content": "inline*",
      "group": "block",
      "draggable": false,
    },
    "mention": {
      attrs: {
        id: {},
        label: {},
      },
      group: 'inline',
      inline: true,
      selectable: false,
      atom: true,
    },
    "image": {
      inline: true,
      attrs: {
        src: {},
        alt: {
          default: null,
        },
        title: {
          default: null,
        },
      },
      group: 'inline',
      draggable: true,
    },
    "horizontal_rule": {
      "group": 'block',
    },
    "bullet_list": {
      content: 'list_item+',
      group: 'block',
    },
    "ordered_list": {
      attrs: {
        order: {
          default: 1,
        },
      },
      content: 'list_item+',
      group: 'block',
    },
    "list_item": {
      content: 'paragraph block*',
      defining: true,
      draggable: false,
    },
    "hard_break": {
      "inline": true,
      "group": "inline",
      "selectable": false,
    },
    "heading": {
      "attrs": {
        "textAlign": {default: null},
        "level": {
          "default": 1
        }
      },
      "content": "inline*",
      "group": "block",
      "defining": true,
      "draggable": false,
    },
    "code_block": {
      "content": 'text*',
      "marks": '',
      "group": 'block',
      "code": true,
      "defining": true,
      "draggable": false,
    },
    "blockquote": {
      "content": "block+",
      "group": "block",
    }
  },
  "marks": {
    "align": {
      attrs: {
        textAlign: { default: null },
      },
    },
    "foreColor":{
      attrs: {
        foreColor: {
          default: null
        },
      },
    },
    "backColor":{
      attrs: {
        backColor: {
          default: null
        },
      },
    },
    "bold": {},
    "code": {},
    "link": {
      attrs: {
        href: {
          default: null,
        },
        target: {
          default: null,
        },
      },
      inclusive: false,
    },
    "italic": {},
    "underline": {},
    "strike": {}
  }
}

module.exports = new Schema(schema)
