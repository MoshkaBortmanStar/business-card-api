// Импортируем библиотеку Express — это веб-сервер (аналог Spring Boot в Java/Kotlin)
const express = require('express');

// Импортируем модуль path — для работы с путями к файлам (аналог java.nio.file.Paths)
const path = require('path');

// Загружаем переменные из файла .env в process.env
// (аналог @Value("${BOT_TOKEN}") из application.properties в Spring)
require('dotenv').config();

// Создаём экземпляр Express-приложения
// (аналог SpringApplication.run(App::class.java) — запуск приложения)
const app = express();

// Достаём переменные из окружения через деструктуризацию
// В Kotlin это было бы:
// val botToken = System.getenv("BOT_TOKEN")
// val chatId = System.getenv("CHAT_ID")
// val port = System.getenv("PORT")
const { BOT_TOKEN, CHAT_ID, PORT } = process.env;

// Говорим Express автоматически парсить JSON из тела запроса
// (аналог Spring сам парсит JSON через Jackson когда видит @RequestBody)
app.use(express.json());

// Говорим Express отдавать статические файлы (HTML, CSS, JS) из папки "public"
// (аналог spring.web.resources.static-locations=classpath:/static/ в Spring)
app.use(express.static(path.join(__dirname, 'public')));

// Создаём POST-эндпоинт "/api/send" — сюда придут данные из формы на сайте
// В Spring это было бы:
// @PostMapping("/api/send")
// fun send(@RequestBody body: RequestDto): ResponseEntity<Map<String, Any>> { ... }
app.post('/api/send', async (req, res) => {

  // Достаём поля name, contact, services из тела запроса (JSON)
  // req.body — это распарсенный JSON
  // В Spring это было бы параметр с @RequestBody:
  // fun send(@RequestBody body: RequestDto) — и Spring сам распарсит JSON в объект
  const { name, contact, services } = req.body;

  // Проверяем: если имя пустое, или контакт пустой, или услуги не выбраны — возвращаем ошибку 400
  // В Spring:
  // if (body.name.isNullOrBlank()) return ResponseEntity.badRequest().body(mapOf("error" to "..."))
  if (!name || !contact || !services?.length) {
    return res.status(400).json({ error: 'Заполни все поля и выбери хотя бы одну услугу' });
  }

  // Формируем текст сообщения для Telegram
  // .join('\n') — склеивает массив строк через перенос строки
  // В Kotlin: listOf("строка1", "строка2").joinToString("\n")
  const text = [
    '📩 Новая заявка с сайта!',
    '',
    `👤 Имя: ${name}`,         // шаблонная строка — аналог "Имя: $name" в Kotlin
    `📱 Контакт: ${contact}`,  // аналог "Контакт: $contact" в Kotlin
    '',
    '🔧 Услуги:',
    ...services.map(s => `  • ${s}`)  // .map — аналог services.map { "  • $it" } в Kotlin
  ].join('\n');

  // try-catch — обработка ошибок (точно как в Kotlin/Java)
  try {
    // fetch — отправляем HTTP POST запрос на Telegram Bot API
    // В Spring это делается через RestTemplate или WebClient:
    // val response = RestTemplate().postForEntity(url, request, String::class.java)
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,  // URL Telegram API
      {
        method: 'POST',                                         // HTTP метод
        headers: { 'Content-Type': 'application/json' },        // заголовок — отправляем JSON
        body: JSON.stringify({                                   // конвертируем объект в JSON строку
          // В Java/Kotlin это ObjectMapper().writeValueAsString(map) или Gson().toJson(map)
          chat_id: CHAT_ID,                                      // кому отправить (твой Telegram ID)
          text,                                                  // текст сообщения
          parse_mode: 'HTML'                                     // формат разметки
        }),
      }
    );

    // Проверяем: если Telegram вернул ошибку — кидаем исключение
    // В Kotlin: if (!response.statusCode.is2xxSuccessful) throw RuntimeException("...")
    if (!response.ok) {
      throw new Error('Telegram API error');
    }

    // Если всё ок — возвращаем клиенту JSON { success: true } со статусом 200
    // В Spring: return ResponseEntity.ok(mapOf("success" to true))
    res.json({ success: true });

  } catch (err) {
    // Ловим ошибку, пишем в консоль и возвращаем клиенту статус 500
    // В Spring: catch (e: Exception) { return ResponseEntity.status(500).body(mapOf("error" to "...")) }
    console.error('Ошибка отправки в Telegram:', err.message);
    res.status(500).json({ error: 'Не удалось отправить сообщение' });
  }
});

// Запускаем сервер на указанном порту
// В Spring это делается автоматически: server.port=3000 в application.properties
// Здесь вручную — аналог встроенного Tomcat в Spring Boot
// '127.0.0.1' — слушаем ТОЛЬКО localhost, снаружи по IP:3000 не достучаться
// Без этого сервер слушает 0.0.0.0 (все интерфейсы) и доступен по IP напрямую
app.listen(PORT, '127.0.0.1', () => {
  // Колбэк — вызывается когда сервер успешно запустился (как ApplicationReadyEvent в Spring)
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
