# Бесплатный демонстрационный стенд на alwaysdata

Вариант рассчитан на личную демонстрацию без платной подписки. На Free доступны Node.js 24, 1 ГБ постоянного диска, 256 МБ RAM и адрес `*.alwaysdata.net` с HTTPS. Тариф предназначен для личного некоммерческого использования; перед развёртыванием проверьте актуальные условия на сайте хостинга.

1. Соберите пакет в Windows: `pwsh -File scripts/package-alwaysdata.ps1 -Destination postavka-alwaysdata.zip`. Архив содержит только production-сборку и `start.mjs`. Локальная SQLite-БД, `.env` и `node_modules` в него не входят.
2. Загрузите архив в свой аккаунт alwaysdata по SFTP/SSH, распакуйте в `/home/<account>/postavka/`. Проверьте наличие `/home/<account>/postavka/start.mjs` и `/home/<account>/postavka/.output/server/index.mjs`.
3. В панели alwaysdata выберите Node.js 24. Создайте сайт типа Node.js с адресом `<account>.alwaysdata.net`, рабочей директорией `/home/<account>/postavka` и командой `node /home/<account>/postavka/start.mjs`.
4. В настройках окружения сайта задайте `POSTAVKA_DB_PATH=/home/<account>/postavka-data/postavka.sqlite`, сильный `POSTAVKA_EDITOR_PASSWORD` и случайный `POSTAVKA_SESSION_SECRET` длиной не менее 32 символов. Не вписывайте значения секретов в Git, команду запуска или архив. `PORT` и `IP` предоставляет хостинг; `start.mjs` передаёт IP в Nitro как `HOST`.
5. Откройте `https://<account>.alwaysdata.net/` и `/api/suppliers`. Войдите, измените тестовую карточку, перезапустите сайт из панели и убедитесь, что изменение и журнал сохранились. Проверьте, что гостю недоступны внутренние заметки и история.

Если приложение не запускается, проверьте журнал сайта, версию Node, путь к архиву и переменные окружения. Папка `postavka-data` должна оставаться вне каталога очередной сборки.

SQLite здесь хранит рабочие данные, а не демонстрационную заглушку. Создайте `/home/<account>/postavka-data` с правами `700`; файлы БД и её `-wal`/`-shm` должны быть доступны только владельцу (`600`). `start.mjs` устанавливает приватную маску прав для новых файлов. Держите БД на локальном диске одного сервера, вне публичного каталога. Общий пароль редактора подходит только для ограниченного демо: перед работой команды потребуются личные учётные записи, права по ролям и отзыв сессий.

Для согласованной резервной копии работающей БД используйте `POSTAVKA_DB_PATH=/home/<account>/postavka-data/postavka.sqlite node /home/<account>/postavka/backup.mjs /home/<account>/postavka-backups/postavka-YYYY-MM-DD.sqlite`. Скрипт проверяет целостность копии до публикации файла. Храните резервные копии вне публичного каталога, ограничьте права и регулярно проверяйте восстановление на отдельной копии. Копии на том же аккаунте не защищают от потери всего аккаунта: сохраняйте зашифрованную копию вне alwaysdata. Не копируйте живой `.sqlite` через SFTP без SQLite backup API, пока включён WAL.

Официальные сведения: [Free](https://www.alwaysdata.com/en/offers/), [Node.js](https://help.alwaysdata.com/en/docs/web-hosting/languages/nodejs/configuration/), [HTTPS](https://help.alwaysdata.com/en/docs/web-hosting/sites/ssl-tls/lets-encrypt/), [SFTP](https://help.alwaysdata.com/en/docs/web-hosting/remote-access/sftp/).

