import type { FC } from 'hono/jsx'

type AddTodoButtonProps = {
  textareaId: string
}

export const AddTodoButton: FC<AddTodoButtonProps> = ({ textareaId }) => {
  const script = `
    (function() {
      var btn = document.getElementById('add-todo-btn');
      var textarea = document.getElementById('${textareaId}');

      btn.addEventListener('click', function() {
        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        var year = tomorrow.getFullYear();
        var month = String(tomorrow.getMonth() + 1).padStart(2, '0');
        var day = String(tomorrow.getDate()).padStart(2, '0');
        var dateStr = year + '-' + month + '-' + day;
        var todoLine = '- TODO[ ] ' + dateStr;

        var content = textarea.value;
        var newContent;
        var cursorPos;

        if (content === '') {
          newContent = todoLine;
          cursorPos = todoLine.length;
        } else {
          var lines = content.split('\\n');
          var tagLineIndex = -1;

          for (var i = lines.length - 1; i >= 0; i--) {
            var trimmed = lines[i].trim();
            if (trimmed === '') continue;
            if (trimmed.charAt(0) === ':' && trimmed.charAt(trimmed.length - 1) === ':') {
              tagLineIndex = i;
            }
            break;
          }

          if (tagLineIndex === -1) {
            newContent = content + '\\n\\n' + todoLine;
            cursorPos = newContent.length;
          } else {
            var beforeTags = lines.slice(0, tagLineIndex).join('\\n');
            var tagLine = lines.slice(tagLineIndex).join('\\n');

            if (beforeTags === '') {
              newContent = todoLine + '\\n\\n' + tagLine;
              cursorPos = todoLine.length;
            } else {
              newContent = beforeTags + '\\n\\n' + todoLine + '\\n\\n' + tagLine;
              cursorPos = beforeTags.length + 2 + todoLine.length;
            }
          }
        }

        textarea.value = newContent;
        textarea.focus();
        textarea.setSelectionRange(cursorPos, cursorPos);
      });
    })();
  `

  return (
    <>
      <button type="button" id="add-todo-btn" class="btn btn-primary">
        Add TODO
      </button>
      <script dangerouslySetInnerHTML={{ __html: script }} />
    </>
  )
}
