
		function validateName() {
			 const name = document.querySelector('[name="name"]').value;
			 const nameRegex = /^[A-Za-z\s]+$/;
			 const nameError = document.getElementById('nameError');
			 nameError.textContent = '';
			 if (!nameRegex.test(name)) {
				  nameError.textContent = "Name must only contain letters and spaces.";
			 }
		}
  
		function validateEmail() {
			 const email = document.querySelector('[name="email"]').value;
			 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			 const emailError = document.getElementById('emailError');
			 emailError.textContent = '';
			 if (!emailRegex.test(email)) {
				  emailError.textContent = "Please enter a valid email address.";
			 }
		}
  
		function validateMobile() {
			 const mno = document.querySelector('[name="mno"]').value;
			 const mnoRegex = /^\d{10}$/;
			 const mnoError = document.getElementById('mnoError');
			 mnoError.textContent = '';
			 if (!mnoRegex.test(mno)) {
				  mnoError.textContent = "Mobile number must be exactly 10 digits.";
			 }
		}
  
		function validatePassword() {
            const password = document.querySelector('[name="password"]').value;
            const passwordError = document.getElementById('passwordError');
            passwordError.textContent = '';

    // Regular expression for a strong password
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(password)) {
        passwordError.textContent = "Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one numeric digit, and one special character (@ $ ! % * ? &).";
    }
}

function validatePasswordConfirmation() {
    const password = document.querySelector('[name="password"]').value;
    const verifyPassword = document.querySelector('[name="verify_password"]').value;
    const passwordMatchError = document.getElementById('passwordMatchError');
    passwordMatchError.textContent = '';

    if (password !== verifyPassword) {
        passwordMatchError.textContent = "Passwords do not match.";
    }
}

	function checkFormValidity() {
    const nameError = document.getElementById('nameError').textContent;
    const emailError = document.getElementById('emailError').textContent;
    const mnoError = document.getElementById('mnoError').textContent;
    const passwordError = document.getElementById('passwordError').textContent;
    const passwordMatchError = document.getElementById('passwordMatchError').textContent;

    const submitButton = document.getElementById('submitButton');
    const formIsValid = !(nameError || emailError || mnoError || passwordError || passwordMatchError);

    if (formIsValid) {
        submitButton.removeAttribute('disabled');
        submitButton.classList.add('enabled');
    } else {
        submitButton.setAttribute('disabled', 'true');
        submitButton.classList.remove('enabled');
     }
}


