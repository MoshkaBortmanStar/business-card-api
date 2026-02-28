// document.getElementById — находит HTML-элемент по его id
// В Android/Kotlin: val button = findViewById<Button>(R.id.dropdownBtn)
// В Java Swing: JButton button = (JButton) frame.getComponentByName("dropdownBtn")
const dropdownBtn = document.getElementById('dropdownBtn');   // кнопка "Выберите услуги"
const dropdownMenu = document.getElementById('dropdownMenu'); // выпадающее меню с чекбоксами
const form = document.getElementById('contactForm');          // форма с полями ввода
const status = document.getElementById('status');             // блок для вывода статуса

// addEventListener — подписываемся на событие 'click' (клик мышкой)
// В Android/Kotlin: button.setOnClickListener { ... }
// В Java Swing: button.addActionListener(e -> { ... })
dropdownBtn.addEventListener('click', () => {
  // classList.toggle('open') — если CSS-класс 'open' есть — убирает, если нет — добавляет
  // Класс 'open' в CSS делает меню видимым (display: block)
  // В Android: if (menu.visibility == VISIBLE) menu.visibility = GONE else menu.visibility = VISIBLE
  dropdownMenu.classList.toggle('open');
});

// Слушаем клик по всему документу (чтобы закрыть меню при клике вне него)
// В Android: это как onTouchEvent на корневом View
document.addEventListener('click', (e) => {
  // e.target — элемент, по которому кликнули (аналог event.source в Java)
  // .closest('.dropdown') — ищет ближайшего родителя с классом 'dropdown'
  // Если клик был НЕ внутри dropdown — закрываем меню
  if (!e.target.closest('.dropdown')) {
    dropdownMenu.classList.remove('open'); // убираем класс 'open' — меню скрывается
  }
});

// Функция собирает выбранные услуги (отмеченные чекбоксы)
// В Kotlin это было бы: fun getSelectedServices(): List<String>
function getSelectedServices() {
  // querySelectorAll — находит ВСЕ элементы по CSS-селектору
  // ':checked' — только те, на которых стоит галочка
  // В Kotlin: checkboxList.filter { it.isChecked }
  const checkboxes = dropdownMenu.querySelectorAll('input[type="checkbox"]:checked');

  // Array.from() — преобразует коллекцию в массив (аналог .toList() в Kotlin)
  // .map(cb => cb.value) — из каждого чекбокса берём value
  // В Kotlin: checkboxes.toList().map { it.value }
  return Array.from(checkboxes).map(cb => cb.value);
}

// Подписываемся на отправку формы (событие 'submit')
// async — функция асинхронная, внутри можно использовать await
// В Kotlin: это как suspend fun или launch { ... } в корутинах
form.addEventListener('submit', async (e) => {
  // Отменяем стандартное поведение формы (перезагрузку страницы)
  // Без этого браузер перезагрузит страницу при нажатии кнопки
  e.preventDefault();

  // .value — получаем текст из поля ввода (аналог editText.text.toString() в Android)
  // .trim() — убираем пробелы по краям (аналог .trim() в Kotlin/Java — String.trim())
  const name = document.getElementById('name').value.trim();
  const contact = document.getElementById('contact').value.trim();

  // Получаем массив выбранных услуг (List<String>)
  const services = getSelectedServices();

  // Если ни одна услуга не выбрана — показываем ошибку и выходим
  // services.length — аналог services.size в Kotlin или services.size() в Java
  if (!services.length) {
    status.textContent = 'Выберите хотя бы одну услугу';  // меняем текст элемента
    status.className = 'status error';                     // меняем CSS-класс (красный цвет)
    return;                                                // return — выходим из функции
  }

  // Находим кнопку отправки внутри формы
  // querySelector — как findViewById, но ищет по CSS-селектору
  const btn = form.querySelector('.submit-btn');
  btn.disabled = true;                  // блокируем кнопку (аналог button.isEnabled = false в Kotlin)
  btn.textContent = 'Отправка...';      // меняем текст (аналог button.text = "Отправка..." в Kotlin)
  status.textContent = '';              // очищаем статус
  status.className = 'status';         // сбрасываем CSS-класс

  try {
    // fetch — отправляем HTTP POST запрос на наш Express сервер
    // await — ждём результат (как .await() у Deferred в корутинах Kotlin)
    // В Spring: RestTemplate().postForEntity("/api/send", requestBody, Map::class.java)
    const res = await fetch('/api/send', {
      method: 'POST',                                    // HTTP метод
      headers: { 'Content-Type': 'application/json' },   // говорим серверу: шлём JSON
      body: JSON.stringify({ name, contact, services }),  // конвертируем объект в JSON-строку
      // JSON.stringify — аналог ObjectMapper().writeValueAsString() в Java (Jackson)
      // или Gson().toJson() в Kotlin
    });

    // res.json() — парсим JSON из ответа сервера
    // В Java: ObjectMapper().readValue(response.body, Map::class.java)
    const data = await res.json();

    // res.ok — true если HTTP статус 200-299 (успех)
    // В Spring: response.statusCode.is2xxSuccessful
    if (res.ok) {
      status.textContent = 'Заявка отправлена! Я свяжусь с вами.';  // показываем успех
      status.className = 'status success';                           // зелёный цвет
      form.reset();  // очищаем все поля формы (аналог editText.setText("") для каждого поля)

      // Снимаем все галочки с чекбоксов
      // forEach — аналог .forEach { it.isChecked = false } в Kotlin
      dropdownMenu.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    } else {
      // Если сервер вернул ошибку — кидаем исключение
      // В Kotlin: throw RuntimeException(data.error ?: "Ошибка")
      throw new Error(data.error || 'Ошибка');
    }
  } catch (err) {
    // Ловим ошибку (сеть упала, сервер не ответил, и т.д.)
    // В Kotlin: catch (e: Exception) { ... }
    status.textContent = err.message;      // err.message — аналог e.message в Kotlin
    status.className = 'status error';     // красный цвет
  } finally {
    // finally — выполнится в любом случае (и при успехе, и при ошибке)
    // Точно как в Kotlin/Java
    btn.disabled = false;                       // разблокируем кнопку (button.isEnabled = true)
    btn.textContent = 'Отправить заявку';        // возвращаем текст кнопки
  }
});
