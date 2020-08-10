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
      parseDOM: [{
        priority: 51,
        tag: `[data-type="${this.name}"]`
      }]
    },
    "todo_item": {
      attrs: {
        done: {
          default: false,
        },
      },
      draggable: true,
      content: 'paragraph+',
      parseDOM: [{
        priority: 51,
        tag: `[data-type="${this.name}"]`,
        getAttrs: dom => ({
          done: dom.getAttribute('data-done') === 'true',
        }),
      }]
    },
    "doc": {
      "content": "block+"
    },
    "text": {
      "group": "inline"
    },
    "paragraph": {
      "content": "inline*",
      "group": "block",
      "draggable": false,
      "parseDOM": [
        {
          "tag": "p"
        }
      ]
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
      parseDOM: [
        {
          tag: 'span[data-mention-id]',
          getAttrs: dom => {
            const id = dom.getAttribute('data-mention-id')
            const label = dom.innerText.split(this.options.matcher.char).join('')
            return { id, label }
          },
        },
      ],
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
      parseDOM: [
        {
          tag: 'img[src]',
          getAttrs: dom => ({
            src: dom.getAttribute('src'),
            title: dom.getAttribute('title'),
            alt: dom.getAttribute('alt'),
          }),
        },
      ],
    },
    "horizontal_rule": {
      "group": 'block',
      "parseDOM": [{ tag: 'hr' }]
    },
    "bullet_list": {
      content: 'list_item+',
      group: 'block',
      parseDOM: [
        { tag: 'ul' },
      ]
    },
    "ordered_list": {
      attrs: {
        order: {
          default: 1,
        },
      },
      content: 'list_item+',
      group: 'block',
      parseDOM: [
        {
          tag: 'ol',
          getAttrs: dom => ({
            order: dom.hasAttribute('start') ? +dom.getAttribute('start') : 1,
          }),
        },
      ],
      toDOM: node => (node.attrs.order === 1 ? ['ol', 0] : ['ol', { start: node.attrs.order }, 0]),
    },
    "list_item": {
      content: 'paragraph block*',
      defining: true,
      draggable: false,
      parseDOM: [
        { tag: 'li' },
      ]
    },
    "hard_break": {
      "inline": true,
      "group": "inline",
      "selectable": false,
      "parseDOM": [
        {
          "tag": "br"
        }
      ]
    },
    "heading": {
      "attrs": {
        "level": {
          "default": 1
        }
      },
      "content": "inline*",
      "group": "block",
      "defining": true,
      "draggable": false,
      "parseDOM": [
        {
          "tag": "h1",
          "attrs": {
            "level": 1
          }
        },
        {
          "tag": "h2",
          "attrs": {
            "level": 2
          }
        },
        {
          "tag": "h3",
          "attrs": {
            "level": 3
          }
        }
      ]
    },
    "code_block": {
      "content": 'text*',
      "marks": '',
      "group": 'block',
      "code": true,
      "defining": true,
      "draggable": false,
      "parseDOM": [
        { "tag": 'pre', "preserveWhitespace": 'full' },
      ]
    },
    "blockquote": {
      "content": "block+",
      "group": "block",
      "parseDOM": [
        {
          "tag": "blockquote"
        }
      ]
    }
  },
  "marks": {
    "bold": {
      "parseDOM": [
        {
          "tag": "strong"
        },
        {
          "tag": "b"
        },
        {
          "style": "font-weight"
        }
      ]
    },
    "code": {
      "parseDOM": [
        {
          "tag": "code"
        }
      ]
    },
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
      parseDOM: [
        {
          tag: 'a[href]',
          getAttrs: dom => ({
            href: dom.getAttribute('href'),
            target: dom.getAttribute('target'),
          }),
        },
      ]
    },
    "italic": {
      "parseDOM": [
        {
          "tag": "i"
        },
        {
          "tag": "em"
        },
        {
          "style": "font-style=italic"
        }
      ]
    },
    "underline": {
      "parseDOM": [
        {
          "tag": "u"
        },
        {
          "tag": "em"
        },
        {
          "style": "text-decoration: underline"
        }
      ]
    },
    "strike": {
      "parseDOM": [
        {
         "tag": 's',
       },
       {
         "tag": 'del',
       },
       {
         "tag": 'strike',
       },
       {
         style: 'text-decoration',
         getAttrs: value => value === 'line-through',
       }
      ]
    }
  }
}

module.exports = new Schema(schema)
