// Validation d'email avec regex strict
export const validateEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

// Validation de mot de passe fort
export const validatePassword = (password) => {
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }

  const allValid = Object.values(requirements).every(val => val === true)

  return {
    isValid: allValid,
    requirements
  }
}

// Vérifier si l'email a un format valide et un domaine existant
export const isValidEmailFormat = (email) => {
  if (!validateEmail(email)) {
    return false
  }

  // Liste des domaines email jetables/fake communs à bloquer
  const disposableEmailDomains = [
    'tempmail.com',
    'throwaway.email',
    'guerrillamail.com',
    'mailinator.com',
    '10minutemail.com',
    'fakeinbox.com',
    'trashmail.com'
  ]

  const domain = email.split('@')[1]?.toLowerCase()
  
  if (disposableEmailDomains.includes(domain)) {
    return false
  }

  return true
}
