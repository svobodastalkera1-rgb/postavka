export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <title>Поставка — страница недоступна</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #070910; color: #f4f7ff; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #9aa7bf; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #8b6cff; color: #fff; }
      .secondary { background: #161c2c; color: #f4f7ff; border-color: #555; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Поставка — страница недоступна</h1>
      <p>Произошла ошибка. Обновите страницу или вернитесь на главную.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Повторить</button>
        <a class="secondary" href="/">На главную</a>
      </div>
    </div>
  </body>
</html>`;
}
