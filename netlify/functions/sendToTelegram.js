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
      console.error('Missing environment variables: BOT_TOKEN or CHAT_IDS');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }
    
    const formData = JSON.parse(event.body);
    
    const { firstName, lastName, birthDate, phone, social, gender, contactMethod, services } = formData;

    let message = `📩 <b>Вам новая заявка:</b>\n\n`;
    message += `<b>Имя:</b> ${firstName}\n`;
    message += `<b>Фамилия:</b> ${lastName}\n`;
    message += `<b>Дата рождения:</b> ${birthDate}\n`;
    message += `<b>Телефон:</b> ${phone}\n`;
    message += `<b>Соцсеть:</b> ${social}\n`;
    message += `<b>Пол:</b> ${gender}\n`;
    message += `<b>Способ связи:</b> ${contactMethod}\n`;
    message += `<b>Услуги:</b> ${services}`;

    const chatIdsArray = CHAT_IDS.split(',');
    const results = [];
    
    for (const chatId of chatIdsArray) {
      try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const params = {
          chat_id: chatId.trim(),
          text: message,
          parse_mode: 'HTML',
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
        });
        
        const result = await response.json();
        results.push({ chatId, success: response.ok, result });
        
        if (!response.ok) {
          console.error(`Error sending to chat ${chatId}:`, result);
        }
        
      } catch (error) {
        console.error(`Error with chat ${chatId}:`, error);
        results.push({ chatId, success: false, error: error.message });
      }
    }

    // Проверяем, был ли хотя бы один успешный отправ
    const hasSuccess = results.some(r => r.success);
    
    if (hasSuccess) {
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'Данные успешно отправлены',
          results: results 
        })
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Ошибка при отправке во все чаты',
          details: results 
        })
      };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Внутренняя ошибка сервера: ' + error.message })
    };
  }
};