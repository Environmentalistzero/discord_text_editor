const editor = document.querySelector('#editor');
const preview = document.querySelector('#preview');
const copyButton = document.querySelector('#copy-button');
const colorMenuButton = document.querySelector('#color-menu-button');
const colorMenu = document.querySelector('#color-menu');

const formatMap = {
  bold: ['**', '**'], italic: ['*', '*'], underline: ['__', '__'],
  strike: ['~~', '~~'], spoiler: ['||', '||'], 'inline-code': ['`', '`'],
  'code-block': ['```\n', '\n```']
};

document.querySelector('#current-time').textContent = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
editor.addEventListener('input', renderPreview);
document.querySelectorAll('[data-format]').forEach(button => button.addEventListener('click', () => applyFormat(...formatMap[button.dataset.format])));
document.querySelectorAll('[data-line-format]').forEach(button => button.addEventListener('click', () => applyLineFormat(button.dataset.lineFormat)));
document.querySelector('#link-button').addEventListener('click', applyLink);

colorMenuButton.addEventListener('click', event => {
  event.stopPropagation();
  const open = colorMenu.hidden;
  colorMenu.hidden = !open;
  colorMenuButton.setAttribute('aria-expanded', String(open));
});
document.addEventListener('click', () => { colorMenu.hidden = true; colorMenuButton.setAttribute('aria-expanded', 'false'); });
colorMenu.addEventListener('click', event => event.stopPropagation());
document.querySelectorAll('[data-color]').forEach(button => button.addEventListener('click', () => {
  const options = {
    red: ['diff', '- ', ''], orange: ['css', '[', ']'], yellow: ['fix', '', ''],
    green: ['diff', '+ ', ''], blue: ['ini', '[', ']']
  };
  applyColor(...options[button.dataset.color]);
  colorMenu.hidden = true;
  colorMenuButton.setAttribute('aria-expanded', 'false');
}));

function applyFormat(prefix, suffix) {
  const { selectionStart: start, selectionEnd: end, value } = editor;
  const selected = value.slice(start, end);
  editor.value = value.slice(0, start) + prefix + selected + suffix + value.slice(end);
  const selectionStart = start + prefix.length;
  editor.focus();
  editor.setSelectionRange(selectionStart, selectionStart + selected.length);
  renderPreview();
}

function applyLineFormat(prefix) {
  const { selectionStart: start, selectionEnd: end, value } = editor;
  const firstLineStart = value.lastIndexOf('\n', start - 1) + 1;
  const lastLineEnd = value.indexOf('\n', end) === -1 ? value.length : value.indexOf('\n', end);
  const selectedLines = value.slice(firstLineStart, lastLineEnd);
  const lines = selectedLines.split('\n');
  const shouldRemove = lines.every(line => line.startsWith(prefix));
  const updated = lines.map(line => shouldRemove ? line.slice(prefix.length) : prefix + line).join('\n');
  editor.value = value.slice(0, firstLineStart) + updated + value.slice(lastLineEnd);
  editor.focus();
  editor.setSelectionRange(firstLineStart, firstLineStart + updated.length);
  renderPreview();
}

function applyLink() {
  const url = window.prompt('Enter the link URL:', 'https://');
  if (!url) return;
  const { selectionStart: start, selectionEnd: end, value } = editor;
  const label = value.slice(start, end) || 'Link text';
  const inserted = `[${label}](${url})`;
  editor.value = value.slice(0, start) + inserted + value.slice(end);
  editor.focus();
  editor.setSelectionRange(start + 1, start + 1 + label.length);
  renderPreview();
}

function applyColor(language, linePrefix, lineSuffix) {
  const { selectionStart: start, selectionEnd: end, value } = editor;
  const selected = value.slice(start, end) || 'Colored text';
  const inserted = `\`\`\`${language}\n${linePrefix}${selected}${lineSuffix}\n\`\`\``;
  editor.value = value.slice(0, start) + inserted + value.slice(end);
  const contentStart = start + language.length + 4 + linePrefix.length;
  editor.focus();
  editor.setSelectionRange(contentStart, contentStart + selected.length);
  renderPreview();
}

function escapeHtml(value) { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;'); }
function safeUrl(value) { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; } catch { return null; } }

function renderInline(text) {
  return text
    .replace(/`([^`\n]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<u>$1</u>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/\|\|([^|]+)\|\|/g, '<span class="spoiler" tabindex="0">$1</span>')
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/(?<!_)_([^_\n]+)_(?!_)/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => { const safe = safeUrl(url.replaceAll('&amp;', '&')); return safe ? `<a href="${safe}" target="_blank" rel="noopener noreferrer">${label}</a>` : label; });
}

function renderCodeBlock(language, content) {
  const classes = { diff: 'syntax-red', css: 'syntax-orange', fix: 'syntax-yellow', ini: 'syntax-blue' };
  let result = content;
  if (language === 'diff') result = content.split('\n').map(line => `<span class="${line.startsWith('+') ? 'syntax-green' : 'syntax-red'}">${line}</span>`).join('\n');
  else if (classes[language]) result = `<span class="${classes[language]}">${content}</span>`;
  return `<pre><code>${result}</code></pre>`;
}

function renderPreview() {
  const source = escapeHtml(editor.value);
  const blocks = [];
  let html = source.replace(/```([a-z0-9]+)?\n([\s\S]*?)```/gi, (_, language = '', content) => { const token = `\u0000BLOCK${blocks.length}\u0000`; blocks.push(renderCodeBlock(language.toLowerCase(), content)); return token; });
  html = html.split('\n').map(line => {
    if (/^### /.test(line)) return `<h3>${renderInline(line.slice(4))}</h3>`;
    if (/^## /.test(line)) return `<h2>${renderInline(line.slice(3))}</h2>`;
    if (/^# /.test(line)) return `<h1>${renderInline(line.slice(2))}</h1>`;
    if (/^&gt; /.test(line)) return `<blockquote>${renderInline(line.slice(5))}</blockquote>`;
    if (/^- /.test(line)) return `<li>${renderInline(line.slice(2))}</li>`;
    return renderInline(line);
  }).join('<br>');
  html = html.replace(/(?:<li>.*?<\/li><br>?)+/g, match => `<ul>${match.replaceAll('<br>', '')}</ul>`);
  blocks.forEach((block, index) => { html = html.replace(`\u0000BLOCK${index}\u0000`, block); });
  preview.innerHTML = html;
}

copyButton.addEventListener('click', async () => {
  if (!editor.value.trim()) return;
  const label = copyButton.lastElementChild;
  try {
    await navigator.clipboard.writeText(editor.value);
    label.textContent = 'Copied!';
    copyButton.classList.add('success');
    window.setTimeout(() => { label.textContent = 'Copy'; copyButton.classList.remove('success'); }, 1800);
  } catch { window.alert('Could not copy the text. Please select and copy it manually.'); }
});

renderPreview();
