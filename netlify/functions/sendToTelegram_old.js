// netlify/functions/sendToTelegram.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
  // Проверяем метод запроса
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { BOT_TOKEN, CHAT_IDS } = process.env;
    
    // Проверяем наличие переменных окружения
    if (!BOT_TOKEN || !CHAT_IDS) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }
    
    const formData = JSON.parse(event.body);
    
    const { firstName, lastName, birthDate, gender, services } = formData;

    let message = `📩 <b>Вам новая заявка:</b>\n\n`;
    message += `<b>Имя:</b> ${firstName}\n`;
    message += `<b>Фамилия:</b> ${lastName}\n`;
    message += `<b>Дата рождения:</b> ${birthDate}\n`;
    message += `<b>Пол:</b> ${gender}\n`;
    message += `<b>Услуги:</b> ${services}`;

    const chatIdsArray = CHAT_IDS.split(',');
    const promises = chatIdsArray.map(chatId => {
      const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
      const params = {
        chat_id: chatId.trim(),
        text: message,
        parse_mode: 'HTML',
      };

      return fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
    });

    const responses = await Promise.all(promises);
    
    // Проверяем все ответы
    const allSuccessful = responses.every(response => response.ok);
    
    if (allSuccessful) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Данные успешно отправлены' })
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Ошибка при отправке в Telegram' })
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Внутренняя ошибка сервера' })
    };
  }
};