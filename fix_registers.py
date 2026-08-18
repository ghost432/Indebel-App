import re

def process_file(filepath, main_color, hover_color, light_color):
    with open(filepath, 'r') as f:
        content = f.read()

    # Fix progress bar
    if filepath == 'frontend/src/pages/RegisterFreelancer.jsx':
        new_step_indicator = """  const renderStepIndicator = () => {
    const steps = ['BCE', 'Identité', 'Mot de passe', 'Activité', 'Email']
    return (
      <div className="mb-8">
        <div className="flex justify-between relative">
          {/* Ligne d'arrière-plan */}
          <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-gray-200 z-0" />
          
          {/* Ligne de progression */}
          <div 
            className="absolute top-5 left-[10%] h-1 transition-all duration-300 z-0 bg-[%MAIN%]" 
            style={{ width: `${((step - 1) / (steps.length - 1)) * 80}%` }} 
          />

          {steps.map((label, index) => (
            <div key={index} className="flex flex-col items-center flex-1 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-300 ${
                step > index + 1 ? 'text-white bg-[%MAIN%]' :
                step === index + 1 ? 'text-white shadow-lg bg-[%MAIN%] shadow-[%MAIN%]/30 ring-4 ring-[%MAIN%]/20' :
                'bg-white text-gray-400 border-2 border-gray-200'
              }`}>
                {step > index + 1 ? <CheckCircle2 className="h-6 w-6" /> : index + 1}
              </div>
              <span className={`text-xs mt-2 text-center font-medium ${step >= index + 1 ? 'text-[#082151]' : 'text-gray-400'}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }""".replace('%MAIN%', main_color)
    else:
        new_step_indicator = """  const renderStepIndicator = () => {
    const steps = ['BCE', 'Identité', 'Mot de passe', 'Activité', 'Email']
    return (
      <div className="mb-8">
        <div className="flex justify-between relative">
          {/* Ligne d'arrière-plan */}
          <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-gray-200 z-0" />
          
          {/* Ligne de progression */}
          <div 
            className="absolute top-5 left-[10%] h-1 transition-all duration-300 z-0 bg-[%MAIN%]" 
            style={{ width: `${((step - 1) / (steps.length - 1)) * 80}%` }} 
          />

          {steps.map((label, index) => (
            <div key={index} className="flex flex-col items-center flex-1 relative z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors duration-300 ${
                step > index + 1 ? 'text-white bg-[%MAIN%]' :
                step === index + 1 ? 'text-white shadow-lg bg-[%MAIN%] shadow-[%MAIN%]/30 ring-4 ring-[%MAIN%]/20' :
                'bg-white text-gray-400 border-2 border-gray-200'
              }`}>
                {step > index + 1 ? <CheckCircle2 className="h-6 w-6" /> : index + 1}
              </div>
              <span className={`text-xs mt-2 text-center font-medium ${step >= index + 1 ? 'text-[#082151]' : 'text-gray-400'}`}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }""".replace('%MAIN%', main_color)

    content = re.sub(r'  const renderStepIndicator = \(\) => \{[\s\S]*?    \)\n  \}', new_step_indicator, content)

    if filepath == 'frontend/src/pages/RegisterFreelancer.jsx':
        # Replace Tailwind green colors with the orange hex
        content = re.sub(r'bg-green-500', f'bg-[{main_color}]', content)
        content = re.sub(r'bg-green-600', f'bg-[{main_color}]', content)
        content = re.sub(r'text-green-500', f'text-[{main_color}]', content)
        content = re.sub(r'text-green-600', f'text-[{main_color}]', content)
        content = re.sub(r'text-green-700', f'text-[{hover_color}]', content)
        content = re.sub(r'text-green-800', f'text-[{hover_color}]', content)
        content = re.sub(r'from-green-400', f'from-[{main_color}]', content)
        content = re.sub(r'from-green-500', f'from-[{main_color}]', content)
        content = re.sub(r'from-green-600', f'from-[{main_color}]', content)
        content = re.sub(r'to-green-600', f'to-[{hover_color}]', content)
        content = re.sub(r'to-green-700', f'to-[{hover_color}]', content)
        content = re.sub(r'hover:from-green-600', f'hover:from-[{hover_color}]', content)
        content = re.sub(r'hover:to-green-700', f'hover:to-[{hover_color}]', content)
        content = re.sub(r'hover:text-green-500', f'hover:text-[{main_color}]', content)
        content = re.sub(r'focus:ring-green-500\/20', f'focus:ring-[{main_color}]/20', content)
        content = re.sub(r'focus:ring-green-500', f'focus:ring-[{main_color}]', content)
        content = re.sub(r'focus:border-green-500', f'focus:border-[{main_color}]', content)
        content = re.sub(r'border-green-500', f'border-[{main_color}]', content)
        content = re.sub(r'border-green-200', f'border-[{main_color}]/20', content)
        content = re.sub(r'bg-green-50', f'bg-[{main_color}]/10', content)
    else:
        # Replace Tailwind blue colors with the blue hex
        content = re.sub(r'bg-blue-500', f'bg-[{main_color}]', content)
        content = re.sub(r'bg-blue-600', f'bg-[{main_color}]', content)
        content = re.sub(r'text-blue-500', f'text-[{main_color}]', content)
        content = re.sub(r'text-blue-600', f'text-[{main_color}]', content)
        content = re.sub(r'text-blue-700', f'text-[{hover_color}]', content)
        content = re.sub(r'text-blue-800', f'text-[{hover_color}]', content)
        content = re.sub(r'from-blue-400', f'from-[{main_color}]', content)
        content = re.sub(r'from-blue-500', f'from-[{main_color}]', content)
        content = re.sub(r'from-blue-600', f'from-[{main_color}]', content)
        content = re.sub(r'to-blue-600', f'to-[{hover_color}]', content)
        content = re.sub(r'to-blue-700', f'to-[{hover_color}]', content)
        content = re.sub(r'hover:from-blue-600', f'hover:from-[{hover_color}]', content)
        content = re.sub(r'hover:to-blue-700', f'hover:to-[{hover_color}]', content)
        content = re.sub(r'hover:text-blue-500', f'hover:text-[{main_color}]', content)
        content = re.sub(r'focus:ring-blue-500\/20', f'focus:ring-[{main_color}]/20', content)
        content = re.sub(r'focus:ring-blue-500', f'focus:ring-[{main_color}]', content)
        content = re.sub(r'focus:border-blue-500', f'focus:border-[{main_color}]', content)
        content = re.sub(r'border-blue-500', f'border-[{main_color}]', content)
        content = re.sub(r'border-blue-200', f'border-[{main_color}]/20', content)
        content = re.sub(r'bg-blue-50', f'bg-[{main_color}]/10', content)
        
        # Restore green colors used for generic success UI in RegisterEmployer
        content = re.sub(r'text-green-500', f'text-[#10b981]', content) 
        content = re.sub(r'text-green-700', f'text-[#047857]', content)
        content = re.sub(r'text-green-800', f'text-[#065f46]', content)
        content = re.sub(r'border-green-200', f'border-[#a7f3d0]', content)
        content = re.sub(r'bg-green-50', f'bg-[#ecfdf5]', content)
        content = re.sub(r'border-green-500', f'border-[#10b981]', content)
        content = re.sub(r'focus:ring-green-500', f'focus:ring-[#10b981]', content)

    # Finally replace the generic blurry blobs hex colors with the accurate ones
    content = re.sub(r'#c02525', r'#df6422', content)
    content = re.sub(r'#082151', r'#2b4eef', content)
    
    with open(filepath, 'w') as f:
        f.write(content)

process_file('frontend/src/pages/RegisterFreelancer.jsx', '#df6422', '#c25319', '#f38a53')
process_file('frontend/src/pages/RegisterEmployer.jsx', '#2b4eef', '#1e38b3', '#5270f2')

