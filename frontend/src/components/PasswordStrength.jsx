import { CheckCircle2, XCircle } from 'lucide-react'

const PasswordStrength = ({ password, confirmPassword }) => {
  const requirements = [
    {
      label: 'Au moins 8 caractères',
      test: (pwd) => pwd.length >= 8
    },
    {
      label: 'Une lettre majuscule',
      test: (pwd) => /[A-Z]/.test(pwd)
    },
    {
      label: 'Une lettre minuscule',
      test: (pwd) => /[a-z]/.test(pwd)
    },
    {
      label: 'Un chiffre',
      test: (pwd) => /[0-9]/.test(pwd)
    },
    {
      label: 'Un caractère spécial (!@#$%^&*)',
      test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    }
  ]

  const passwordMatch = password && confirmPassword && password === confirmPassword

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <p className="text-xs font-medium text-gray-700 mb-2">Le mot de passe doit contenir :</p>
      <ul className="space-y-1">
        {requirements.map((req, index) => {
          const passes = req.test(password)
          return (
            <li key={index} className="flex items-center text-xs">
              {passes ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 text-gray-300 mr-2" />
              )}
              <span className={passes ? 'text-green-600' : 'text-gray-500'}>
                {req.label}
              </span>
            </li>
          )
        })}
      </ul>
      
      {confirmPassword && (
        <div className="mt-2 pt-2 border-t border-gray-300">
          <div className="flex items-center text-xs">
            {passwordMatch ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-green-600">Les mots de passe correspondent</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-500 mr-2" />
                <span className="text-red-600">Les mots de passe ne correspondent pas</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PasswordStrength
