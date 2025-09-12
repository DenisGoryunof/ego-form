document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('service-form');
    const popup = document.getElementById('popup');
    const closeBtn = document.querySelector('.close-btn');
    const submitButton = form.querySelector('button[type="submit"]');

    // Input fields
    const firstName = document.getElementById('first-name');
    const lastName = document.getElementById('last-name');
    const birthDate = document.getElementById('birth-date');
    const genderRadios = document.querySelectorAll('input[name="gender"]');
    const servicesCheckboxes = document.querySelectorAll('input[name="services"]');
    const servicesGroup = document.getElementById('services-group');
    const genderFieldset = document.querySelector('input[name="gender"]').closest('fieldset');

    const fieldsToValidate = [
        { element: firstName, validator: () => validateRequired(firstName) },
        { element: lastName, validator: () => validateRequired(lastName) },
        { element: birthDate, validator: () => validateRequired(birthDate) },
        { elements: genderRadios, validator: validateRadioGroup },
        { elements: servicesCheckboxes, validator: validateCheckboxGroup },
    ];

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const isFormValid = validateForm();
        if (isFormValid) {
            setButtonLoading(true);
            try {
                await sendToTelegram();
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
        if (!validateRadioGroup()) isValid = false;
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
		  const genderValue = document.querySelector('input[name="gender"]:checked').labels[0].textContent;
		  const servicesValue = Array.from(document.querySelectorAll('input[name="services"]:checked'))
			  .map(cb => cb.labels[0].textContent)
			  .join(', ');

		  const formData = {
			firstName: firstNameValue,
			lastName: lastNameValue,
			birthDate: birthDateValue,
			gender: genderValue,
			services: servicesValue
		  };

		  try {
			const response = await fetch('/.netlify/functions/sendToTelegram', {
			  method: 'POST',
			  headers: {
				'Content-Type': 'application/json',
			  },
			  body: JSON.stringify(formData),
			});

			const result = await response.json();
			
			if (!response.ok) {
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
});