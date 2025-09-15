document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('service-form');
    const popup = document.getElementById('popup');
    const closeBtn = document.querySelector('.close-btn');
    const submitButton = form.querySelector('button[type="submit"]');

    // Input fields
    const firstName = document.getElementById('first-name');
    const lastName = document.getElementById('last-name');
    const birthDate = document.getElementById('birth-date');
    const phone = document.getElementById('phone');
    const social = document.getElementById('social');
    const genderRadios = document.querySelectorAll('input[name="gender"]');
    const contactMethodRadios = document.querySelectorAll('input[name="contactMethod"]');
    const servicesCheckboxes = document.querySelectorAll('input[name="services"]');
    const servicesGroup = document.getElementById('services-group');
    const genderFieldset = document.querySelector('input[name="gender"]').closest('fieldset');
    const contactMethodFieldset = document.querySelector('input[name="contactMethod"]').closest('fieldset');

    const fieldsToValidate = [
        { element: firstName, validator: () => validateRequired(firstName) },
        { element: lastName, validator: () => validateRequired(lastName) },
        { element: birthDate, validator: () => validateRequired(birthDate) },
        { element: phone, validator: () => validatePhone(phone) },
        { element: social, validator: () => validateSocial(social) },
        { elements: genderRadios, validator: validateRadioGroup },
        { elements: contactMethodRadios, validator: () => validateContactMethod() },
        { elements: servicesCheckboxes, validator: validateCheckboxGroup },
    ];

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const isFormValid = validateForm();
        if (isFormValid) {
            setButtonLoading(true);
            try {
                console.log('Starting form submission...');
                const result = await sendToTelegram();
                console.log('Form submitted successfully:', result);
                showPopup();
            } catch (error) {
                console.error("Failed to send message to Telegram:", error);
                alert("Произошла ошибка при отправке заказа. Пожалуйста, попробуйте еще раз.");
            } finally {
                setButtonLoading(false);
            }
        }
    });

    fieldsToValidate.forEach(field => {
        const elements = field.element ? [field.element] : Array.from(field.elements);
        elements.forEach(el => {
            const eventType = (el.type === 'checkbox' || el.type === 'radio' || el.type === 'date') ? 'change' : 'input';
            el.addEventListener(eventType, () => field.validator());
        });
    });

    function validateRequired(element) {
        const container = element.parentElement;
        if (element.value.trim() === '') {
            let labelText = container.querySelector('label').innerText.replace(' *', '');
            if (element.type === 'date') {
               labelText = 'Дата рождения';
            }
            showError(container, `${labelText} обязательно для заполнения.`);
            return false;
        }
        clearError(container);
        return true;
    }

    function validatePhone(element) {
        const container = element.parentElement;
        const phoneValue = element.value.trim();
        
        if (phoneValue === '') {
            showError(container, 'Номер телефона обязателен для заполнения.');
            return false;
        }
        
        // Простая валидация номера телефона
        const phoneRegex = /^(\+7|8)[\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}$/;
        if (!phoneRegex.test(phoneValue.replace(/\s/g, ''))) {
            showError(container, 'Введите корректный номер телефона.');
            return false;
        }
        
        clearError(container);
        return true;
    }

    function validateSocial(element) {
        const container = element.parentElement;
        const socialValue = element.value.trim();
        
        if (socialValue === '') {
            showError(container, 'Ссылка на соцсеть обязательна для заполнения.');
            return false;
        }
        
        // Валидация WhatsApp или Telegram ссылки
        const whatsappRegex = /^https?:\/\/(wa\.me|api\.whatsapp\.com)\/\+\d+(\?.*)?$/;
        const telegramRegex = /^https?:\/\/(t\.me|telegram\.me)\/[a-zA-Z0-9_]{5,32}$/;
        
        if (!whatsappRegex.test(socialValue) && !telegramRegex.test(socialValue)) {
            showError(container, 'Введите корректную ссылку WhatsApp или Telegram.');
            return false;
        }
        
        clearError(container);
        return true;
    }

    function validateRadioGroup() {
        const checked = document.querySelector('input[name="gender"]:checked');
        const container = genderFieldset;
        if (!checked) {
            showError(container, 'Выберите ваш пол.');
            return false;
        }
        clearError(container);
        return true;
    }

    function validateContactMethod() {
        const checked = document.querySelector('input[name="contactMethod"]:checked');
        const container = contactMethodFieldset;
        if (!checked) {
            showError(container, 'Выберите предпочтительный способ связи.');
            return false;
        }
        clearError(container);
        return true;
    }

    function validateCheckboxGroup() {
        const checked = document.querySelectorAll('input[name="services"]:checked');
        const container = servicesGroup;
        if (checked.length === 0) {
            showError(container, 'Выберите хотя бы одну услугу.');
            return false;
        }
        clearError(container);
        return true;
    }

    const validateForm = () => {
        let isValid = true;
        if (!validateRequired(firstName)) isValid = false;
        if (!validateRequired(lastName)) isValid = false;
        if (!validateRequired(birthDate)) isValid = false;
        if (!validatePhone(phone)) isValid = false;
        if (!validateSocial(social)) isValid = false;
        if (!validateRadioGroup()) isValid = false;
        if (!validateContactMethod()) isValid = false;
        if (!validateCheckboxGroup()) isValid = false;
        return isValid;
    };

    const showError = (containerElement, message) => {
        containerElement.classList.add('invalid');
        const errorContainer = containerElement.querySelector('.error-message');
        if (errorContainer) {
            errorContainer.textContent = message;
        }
    };

    const clearError = (containerElement) => {
        containerElement.classList.remove('invalid');
        const errorContainer = containerElement.querySelector('.error-message');
        if (errorContainer) {
            errorContainer.textContent = '';
        }
    };

    const setButtonLoading = (isLoading) => {
        if (isLoading) {
            submitButton.disabled = true;
            submitButton.textContent = 'Отправка...';
        } else {
            submitButton.disabled = false;
            submitButton.textContent = 'Отправить';
        }
    };

    const sendToTelegram = async () => {
        const firstNameValue = firstName.value.trim();
        const lastNameValue = lastName.value.trim();
        const birthDateValue = new Date(birthDate.value).toLocaleDateString('ru-RU');
        const phoneValue = phone.value.trim();
        const socialValue = social.value.trim();
        const genderValue = document.querySelector('input[name="gender"]:checked').labels[0].textContent;
        const contactMethodValue = document.querySelector('input[name="contactMethod"]:checked').labels[0].textContent;
        const servicesValue = Array.from(document.querySelectorAll('input[name="services"]:checked'))
            .map(cb => cb.labels[0].textContent)
            .join(', ');

        const formData = {
            firstName: firstNameValue,
            lastName: lastNameValue,
            birthDate: birthDateValue,
            phone: phoneValue,
            social: socialValue,
            gender: genderValue,
            contactMethod: contactMethodValue,
            services: servicesValue
        };

        console.log('Sending data:', formData);

        try {
            const response = await fetch('/.netlify/functions/sendToTelegram', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();
            console.log('Server response:', result);
            
            if (!response.ok) {
                // Если статус 500, но сообщение отправлено (частично успешно)
                if (response.status === 500 && result.message) {
                    // Все равно считаем успехом, если есть message
                    return result;
                }
                throw new Error(result.error || 'Ошибка при отправке данных');
            }

            return result;
        } catch (error) {
            console.error("Failed to send message:", error);
            throw error;
        }
    };

    const showPopup = () => {
        popup.classList.add('show');
    };

    const hidePopup = () => {
        popup.classList.remove('show');
        form.reset();
        document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    };

    closeBtn.addEventListener('click', hidePopup);

    popup.addEventListener('click', (event) => {
        if (event.target === popup) {
            hidePopup();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === "Escape" && popup.classList.contains('show')) {
            hidePopup();
        }
    });

    // Маска для телефона
    phone.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.startsWith('7')) {
            value = '+7' + value.substring(1);
        } else if (value.startsWith('8')) {
            value = '+7' + value.substring(1);
        } else if (!value.startsWith('+')) {
            value = '+7' + value;
        }
        
        // Форматирование: +7 (999) 999-99-99
        if (value.length > 2) {
            value = value.substring(0, 2) + ' (' + value.substring(2);
        }
        if (value.length > 7) {
            value = value.substring(0, 7) + ') ' + value.substring(7);
        }
        if (value.length > 12) {
            value = value.substring(0, 12) + '-' + value.substring(12);
        }
        if (value.length > 15) {
            value = value.substring(0, 15) + '-' + value.substring(15);
        }
        
        e.target.value = value;
    });
});