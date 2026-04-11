import type { CVData, TemplateType } from "@/types/cv-types"

interface CVPreviewProps {
  template: TemplateType
  className?: string
  userData?: Partial<CVData>
}

export function CVPreview({ template, className = "", userData }: CVPreviewProps) {
  // Parse skills into an array if provided
  const skillsArray = userData?.skills
    ? Array.isArray(userData.skills)
      ? userData.skills.map(skill => typeof skill === 'string' ? skill : skill.name)
      : userData.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
    : ["Excel", "SQL", "Python", "Tableau", "Financial Modeling", "Data Analysis"]

  // Check if this is for A4 print preview (based on className or style props)
  const isA4Preview = className.includes('w-full') || className.includes('a4')

  const getTemplateContent = () => {
    switch (template) {
      case "professional":
        return (
          <div className={`bg-white ${isA4Preview ? '' : 'border border-gray-200 rounded-lg shadow-sm'} overflow-hidden ${className}`}>
            <div className={`${isA4Preview ? 'p-8' : 'p-6'} space-y-4`}>
              {/* Header - ATS Optimized */}
              <div className="border-b-2 border-gray-800 pb-4">
                <h1 className={`${isA4Preview ? 'text-2xl' : 'text-xl'} font-bold text-gray-900 uppercase tracking-wide`}>{userData?.personalInfo?.fullName || "John Smith"}</h1>
                <p className={`${isA4Preview ? 'text-base' : 'text-sm'} font-semibold text-gray-800 mt-1`}>
                  {userData?.personalInfo?.jobTitle || "Senior Financial Analyst"}
                </p>
                <div className={`${isA4Preview ? 'space-y-1' : 'space-y-0.5'} text-sm text-gray-700 mt-3 font-medium`}>
                  <div>{userData?.personalInfo?.email || "john.smith@email.com"}</div>
                  <div>{userData?.personalInfo?.phone || "+27 11 123 4567"}</div>
                  <div>{userData?.personalInfo?.location || "Johannesburg, SA"}</div>
                  {userData?.personalInfo?.linkedIn && <div>{userData.personalInfo.linkedIn}</div>}
                </div>
              </div>

              {/* Professional Summary - ATS Optimized */}
              <div>
                <h2 className={`${isA4Preview ? 'text-base' : 'text-sm'} font-bold text-gray-900 uppercase border-b border-gray-300 pb-1 mb-3`}>PROFESSIONAL SUMMARY</h2>
                <p className={`${isA4Preview ? 'text-sm' : 'text-xs'} text-gray-800 leading-relaxed`}>
                  {userData?.summary ||
                    "Experienced Financial Analyst with over 8 years of expertise in financial modeling, data analysis, and investment research. Proven track record of delivering actionable insights that drive strategic decision-making."}
                </p>
              </div>

              {/* Experience - ATS Optimized */}
              <div>
                <h2 className={`${isA4Preview ? 'text-base' : 'text-sm'} font-bold text-gray-900 uppercase border-b border-gray-300 pb-1 mb-3`}>PROFESSIONAL EXPERIENCE</h2>
                <div className="space-y-4">
                  {userData?.experience && userData.experience.length > 0 ? (
                    userData.experience.map((exp, index) => (
                      <div key={index} className="border-l-4 border-gray-400 pl-4">
                        <h3 className={`${isA4Preview ? 'text-sm' : 'text-xs'} font-bold text-gray-900`}>{exp.title || "Job Title"}</h3>
                        <p className={`${isA4Preview ? 'text-xs' : 'text-[10px]'} font-semibold text-gray-700`}>
                          {exp.company || "Company"} | {exp.location || "Location"} | {exp.startDate || "Start Date"} - {exp.endDate || "End Date"}
                        </p>
                        <div className={`${isA4Preview ? 'text-xs' : 'text-[10px]'} text-gray-800 mt-2`}>
                          {exp.description ? (
                            <ul className="space-y-1 list-disc ml-4">
                              {exp.description.split('\n').map((line, i) => (
                                <li key={i} className="leading-relaxed">{line}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="leading-relaxed">Job description with measurable achievements</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="border-l-4 border-gray-400 pl-4">
                        <h3 className={`${isA4Preview ? 'text-sm' : 'text-xs'} font-bold text-gray-900`}>Senior Financial Analyst</h3>
                        <p className={`${isA4Preview ? 'text-xs' : 'text-[10px]'} font-semibold text-gray-700`}>
                          ABC Corporation | Johannesburg, SA | 2020 - Present
                        </p>
                        <ul className={`${isA4Preview ? 'text-xs' : 'text-[10px]'} text-gray-800 mt-2 space-y-1 list-disc ml-4`}>
                          <li>Achieved 35% improvement in forecasting accuracy through advanced financial modeling</li>
                          <li>Managed investment portfolio worth R50M+ with 15% annual returns</li>
                          <li>Developed automated reporting systems reducing processing time by 40%</li>
                        </ul>
                      </div>
                      <div className="border-l-4 border-gray-400 pl-4">
                        <h3 className={`${isA4Preview ? 'text-sm' : 'text-xs'} font-bold text-gray-900`}>Financial Analyst</h3>
                        <p className={`${isA4Preview ? 'text-xs' : 'text-[10px]'} font-semibold text-gray-700`}>
                          XYZ Company | Cape Town, SA | 2018 - 2020
                        </p>
                        <ul className={`${isA4Preview ? 'text-xs' : 'text-[10px]'} text-gray-800 mt-2 space-y-1 list-disc ml-4`}>
                          <li>Conducted comprehensive market research and competitor analysis</li>
                          <li>Prepared detailed monthly financial reports for executive team</li>
                          <li>Identified cost-saving opportunities resulting in R2M annual savings</li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Education - ATS Optimized */}
              <div>
                <h2 className={`${isA4Preview ? 'text-base' : 'text-sm'} font-bold text-gray-900 uppercase border-b border-gray-300 pb-1 mb-3`}>EDUCATION</h2>
                <div className="space-y-3">
                  {userData?.education && userData.education.length > 0 ? (
                    userData.education.map((edu, index) => (
                      <div key={index} className="border-l-4 border-gray-400 pl-4">
                        <h3 className={`${isA4Preview ? 'text-sm' : 'text-xs'} font-bold text-gray-900`}>{edu.degree || "Degree"}</h3>
                        <p className={`${isA4Preview ? 'text-xs' : 'text-[10px]'} font-semibold text-gray-700`}>
                          {edu.institution || "Institution"} | {edu.location || "Location"} | {edu.graduationDate || "Graduation Date"}
                        </p>
                        {edu.nqfLevel && (
                          <p className={`${isA4Preview ? 'text-xs' : 'text-[10px]'} text-gray-600 mt-1`}>NQF Level {edu.nqfLevel}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="border-l-4 border-gray-400 pl-4">
                      <h3 className={`${isA4Preview ? 'text-sm' : 'text-xs'} font-bold text-gray-900`}>Bachelor of Commerce, Finance</h3>
                      <p className={`${isA4Preview ? 'text-xs' : 'text-[10px]'} font-semibold text-gray-700`}>
                        University of Cape Town | Cape Town, South Africa | 2018
                      </p>
                      <p className={`${isA4Preview ? 'text-xs' : 'text-[10px]'} text-gray-600 mt-1`}>NQF Level 7 | Cum Laude</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills - ATS Optimized */}
              <div>
                <h2 className={`${isA4Preview ? 'text-base' : 'text-sm'} font-bold text-gray-900 uppercase border-b border-gray-300 pb-1 mb-3`}>TECHNICAL SKILLS</h2>
                <div className="grid grid-cols-1 gap-2">
                  {skillsArray.map((skill, index) => (
                    <div key={index} className={`${isA4Preview ? 'text-xs' : 'text-[10px]'} text-gray-800`}>
                      • {skill}
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Sections */}
              {userData?.customSections && userData.customSections.length > 0 && userData.customSections.map(section => (
                section.title && (
                  <div key={section.id}>
                    <h2 className="text-sm font-semibold text-gray-800 mb-2">{section.title.toUpperCase()}</h2>
                    <p className="text-xs text-gray-600 whitespace-pre-line">{section.content}</p>
                  </div>
                )
              ))}
            </div>
          </div>
        )

      case "modern":
        return (
          <div className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
            <div className="bg-blue-600 text-white p-4">
              <h1 className="text-lg font-bold">{userData?.personalInfo?.fullName || "Sarah Johnson"}</h1>
              <p className="text-sm opacity-90">{userData?.personalInfo?.jobTitle || "UX/UI Designer"}</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="space-y-1 text-xs text-gray-600">
                <div>{userData?.personalInfo?.email || "sarah@email.com"}</div>
                <div>{userData?.personalInfo?.phone || "+27 21 987 6543"}</div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-blue-600 mb-2">About</h2>
                <p className="text-xs text-gray-600">
                  {userData?.summary ||
                    "Creative UX/UI Designer with 5+ years of experience creating user-centered digital experiences for various platforms. Passionate about combining aesthetics with functionality."}
                </p>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-blue-600 mb-2">Experience</h2>
                <div className="space-y-2">
                  {userData?.experience && userData.experience.length > 0 ? (
                    userData.experience.map((exp, index) => (
                      <div key={index} className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xs font-medium">{exp.title || "Job Title"}</h3>
                          <p className="text-xs text-gray-500">{exp.company || "Company"}</p>
                          <p className="text-xs text-gray-600 mt-1">{exp.description || "Job description"}</p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {exp.startDate || "Start"}-{exp.endDate || "End"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xs font-medium">Senior UX Designer</h3>
                        <p className="text-xs text-gray-500">Tech Startup</p>
                      </div>
                      <span className="text-xs text-gray-400">2021-Now</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-blue-600 mb-2">Skills</h2>
                <div className="grid grid-cols-2 gap-1">
                  {skillsArray.map((skill) => (
                    <div key={skill} className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-xs">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case "creative":
        return (
          <div
            className={`bg-gradient-to-br from-purple-50 to-pink-50 border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}
          >
            <div className="p-4 space-y-3">
              <div className="text-center">
                {userData?.personalInfo?.photo ? (
                  <img src={userData.personalInfo.photo} alt="Profile" className="w-12 h-12 rounded-full mx-auto mb-2 object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-xs font-bold">
                    {userData?.personalInfo?.fullName?.split(' ').map(n => n[0]).join('').slice(0,2) || 'AC'}
                  </div>
                )}
                <h1 className="text-lg font-bold text-gray-900">
                  {userData?.personalInfo?.fullName || "Alex Creative"}
                </h1>
                <p className="text-sm text-gray-600">{userData?.personalInfo?.jobTitle || "Graphic Designer"}</p>
              </div>

              <div className="space-y-2 text-center text-xs">
                <div className="flex justify-center items-center gap-2">
                  <div className="h-1.5 bg-purple-300 rounded w-8"></div>
                  <span className="text-gray-600">Portfolio</span>
                </div>
                <div className="flex justify-center items-center gap-2">
                  <div className="h-1.5 bg-pink-300 rounded w-8"></div>
                  <span className="text-gray-600">{userData?.personalInfo?.email || "Email"}</span>
                </div>
                <div className="flex justify-center items-center gap-2">
                  <div className="h-1.5 bg-purple-300 rounded w-8"></div>
                  <span className="text-gray-600">{userData?.personalInfo?.phone || "Phone"}</span>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-purple-600 mb-2">Creative Skills</h2>
                <div className="space-y-1">
                  {skillsArray.map((skill) => (
                    <div key={skill} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-pink-400 rounded-full"></div>
                      <span className="text-xs">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-purple-600 mb-2">Experience</h2>
                <div className="space-y-2">
                  {userData?.experience && userData.experience.length > 0 ? (
                    userData.experience.map((exp, index) => (
                      <div key={index} className="bg-white/50 rounded p-2">
                        <h3 className="text-xs font-medium">{exp.title || "Job Title"}</h3>
                        <p className="text-xs text-gray-500">
                          {exp.company || "Company"} • {exp.startDate || "Start Date"}-{exp.endDate || "End Date"}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{exp.description || "Job Description"}</p>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="bg-white/50 rounded p-2">
                        <h3 className="text-xs font-medium">Creative Director</h3>
                        <p className="text-xs text-gray-500">Design Agency • 2022-Present</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Leading brand identity projects for major clients. Award-winning campaign design.
                        </p>
                      </div>
                      <div className="bg-white/50 rounded p-2">
                        <h3 className="text-xs font-medium">Graphic Designer</h3>
                        <p className="text-xs text-gray-500">Marketing Firm • 2020-2022</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Created visual assets for digital and print campaigns.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case "simple":
        return (
          <div className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
            <div className="p-6 space-y-3">
              {/* Header */}
              <div className="text-center border-b border-gray-200 pb-3">
                <h1 className="text-lg font-bold text-gray-900">
                  {userData?.personalInfo?.fullName || "Michael Brown"}
                </h1>
                <p className="text-sm text-gray-600">
                  {userData?.personalInfo?.jobTitle || "Graduate Software Developer"}
                </p>
                <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                  <div>{userData?.personalInfo?.email || "michael.brown@email.com"}</div>
                  <div>{userData?.personalInfo?.phone || "+27 82 456 7890"}</div>
                </div>
              </div>

              {/* Objective */}
              <div>
                <h2 className="text-sm font-semibold text-gray-800 mb-2">OBJECTIVE</h2>
                <p className="text-xs text-gray-600">
                  {userData?.summary ||
                    "Recent Computer Science graduate seeking an entry-level software development position to apply my programming skills and contribute to innovative projects."}
                </p>
              </div>

              {/* Education */}
              <div>
                <h2 className="text-sm font-semibold text-gray-800 mb-2">EDUCATION</h2>
                {userData?.education && userData.education.length > 0 ? (
                  userData.education.map((edu, index) => (
                    <div key={index}>
                      <h3 className="text-xs font-medium text-gray-700">{edu.degree || "Degree"}</h3>
                      <p className="text-xs text-gray-500">
                        {edu.institution || "Institution"} • {edu.graduationDate || "Graduation Date"}
                      </p>
                      <p className="text-xs text-gray-600">{edu.location || "Location"}</p>
                    </div>
                  ))
                ) : (
                  <div>
                    <h3 className="text-xs font-medium text-gray-700">BSc Computer Science</h3>
                    <p className="text-xs text-gray-500">University of Cape Town • 2024</p>
                    <p className="text-xs text-gray-600 mt-1">First Class Honours • Dean's List</p>
                  </div>
                )}
              </div>

              {/* Skills */}
              <div>
                <h2 className="text-sm font-semibold text-gray-800 mb-2">TECHNICAL SKILLS</h2>
                <div className="text-xs text-gray-600">
                  {skillsArray.map((skill, index) => (
                    <p key={index}>• {skill}</p>
                  ))}
                </div>
              </div>

              {/* Projects */}
              <div>
                <h2 className="text-sm font-semibold text-gray-800 mb-2">PROJECTS</h2>
                {userData?.experience && userData.experience.length > 0 ? (
                  userData.experience.map((exp, index) => (
                    <div key={index}>
                      <h3 className="text-xs font-medium text-gray-700">{exp.title || "Project Title"}</h3>
                      <p className="text-xs text-gray-600 mt-1">{exp.description || "Project Description"}</p>
                    </div>
                  ))
                ) : (
                  <div>
                    <h3 className="text-xs font-medium text-gray-700">E-commerce Web App</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      Developed a full-stack e-commerce platform with React, Node.js, and MongoDB. Implemented user
                      authentication and payment processing.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case "executive":
        return (
          <div className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
            <div className="bg-gray-900 text-white p-4">
              <h1 className="text-xl font-bold">{userData?.personalInfo?.fullName || "Robert Executive"}</h1>
              <p className="text-sm opacity-90">{userData?.personalInfo?.jobTitle || "Chief Executive Officer"}</p>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-3 text-xs">
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-gray-600">{userData?.personalInfo?.email || "robert@company.com"}</p>
                </div>
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-gray-600">{userData?.personalInfo?.phone || "+27 11 555 0123"}</p>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-gray-800 mb-2">EXECUTIVE SUMMARY</h2>
                <p className="text-xs text-gray-600">
                  {userData?.summary ||
                    "Visionary executive with 15+ years of leadership experience driving organizational growth and transformation. Proven track record of increasing revenue, optimizing operations, and building high-performing teams across multiple industries."}
                </p>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-gray-800 mb-2">LEADERSHIP EXPERIENCE</h2>
                <div className="space-y-3">
                  {userData?.experience && userData.experience.length > 0 ? (
                    userData.experience.map((exp, index) => (
                      <div key={index} className="border-l-2 border-gray-900 pl-3">
                        <h3 className="text-xs font-medium text-gray-700">{exp.title || "Job Title"}</h3>
                        <p className="text-xs text-gray-500">
                          {exp.company || "Company"} • {exp.startDate || "Start Date"} - {exp.endDate || "End Date"}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{exp.description || "Job Description"}</p>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="border-l-2 border-gray-900 pl-3">
                        <h3 className="text-xs font-medium text-gray-700">Chief Executive Officer</h3>
                        <p className="text-xs text-gray-500">Global Corp • 2018 - Present</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Led company through digital transformation, resulting in 45% revenue growth and 30% increase
                          in market share. Expanded operations to 5 new markets.
                        </p>
                      </div>
                      <div className="border-l-2 border-gray-300 pl-3">
                        <h3 className="text-xs font-medium text-gray-700">Vice President</h3>
                        <p className="text-xs text-gray-500">Tech Solutions • 2015 - 2018</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Oversaw strategic initiatives that increased annual revenue by R75M. Restructured operations
                          to improve efficiency.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-gray-800 mb-2">KEY ACHIEVEMENTS</h2>
                <div className="space-y-1">
                  {skillsArray.map((skill, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
                      <p className="text-xs text-gray-600">{skill}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case "technical":
        return (
          <div className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
            <div className="p-4 space-y-3">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-gray-200 pb-3">
                <div>
                  <h1 className="text-lg font-bold text-gray-900">
                    {userData?.personalInfo?.fullName || "David Engineer"}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {userData?.personalInfo?.jobTitle || "Senior Software Engineer"}
                  </p>
                </div>
                <div className="text-right text-xs text-gray-500 space-y-0.5">
                  <p>{userData?.personalInfo?.email || "david.eng@email.com"}</p>
                  <p>{userData?.personalInfo?.phone || "+27 21 123 4567"}</p>
                  <p>{userData?.personalInfo?.location || "Cape Town, SA"}</p>
                </div>
              </div>

              {/* Technical Skills */}
              <div>
                <h2 className="text-sm font-semibold text-blue-600 mb-2">TECHNICAL EXPERTISE</h2>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="font-medium text-gray-700">Languages</p>
                    <p className="text-gray-600">
                      {skillsArray.slice(0, skillsArray.length / 4).join(", ") || "Python, Java, C++, Go, JavaScript"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Frameworks</p>
                    <p className="text-gray-600">
                      {skillsArray.slice(skillsArray.length / 4, skillsArray.length / 2).join(", ") ||
                        "Django, Spring, React, Angular"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Databases</p>
                    <p className="text-gray-600">
                      {skillsArray.slice(skillsArray.length / 2, (skillsArray.length / 4) * 3).join(", ") ||
                        "PostgreSQL, MongoDB, Redis"}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Cloud</p>
                    <p className="text-gray-600">
                      {skillsArray.slice((skillsArray.length / 4) * 3).join(", ") || "AWS, Docker, Kubernetes, CI/CD"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Experience */}
              <div>
                <h2 className="text-sm font-semibold text-blue-600 mb-2">PROFESSIONAL EXPERIENCE</h2>
                <div className="space-y-2">
                  {userData?.experience && userData.experience.length > 0 ? (
                    userData.experience.map((exp, index) => (
                      <div key={index}>
                        <div className="flex justify-between items-start">
                          <h3 className="text-xs font-medium text-gray-700">{exp.title || "Job Title"}</h3>
                          <span className="text-xs text-gray-500">
                            {exp.startDate || "Start Date"}-{exp.endDate || "End Date"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{exp.company || "Company"}</p>
                        <p className="text-xs text-gray-600 mt-1">{exp.description || "Job Description"}</p>
                      </div>
                    ))
                  ) : (
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-xs font-medium text-gray-700">Senior Software Engineer</h3>
                        <span className="text-xs text-gray-500">2021-Present</span>
                      </div>
                      <p className="text-xs text-gray-500">TechCorp Solutions</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Lead developer for high-traffic web application serving 1M+ users. Architected microservices
                        infrastructure that improved system reliability by 99.9%.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Certifications */}
              <div>
                <h2 className="text-sm font-semibold text-blue-600 mb-2">CERTIFICATIONS</h2>
                <div className="text-xs text-gray-600">
                  {skillsArray.map((skill, index) => (
                    <p key={index}>• {skill}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case "graduate":
        return (
          <div className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
            <div className="p-4 space-y-3">
              {/* Header */}
              <div className="text-center pb-3 border-b border-gray-200">
                <h1 className="text-lg font-bold text-gray-900">
                  {userData?.personalInfo?.fullName || "Emma Graduate"}
                </h1>
                <p className="text-sm text-gray-600">
                  {userData?.personalInfo?.jobTitle || "Recent Marketing Graduate"}
                </p>
                <div className="flex flex-col items-center gap-1 text-xs text-gray-500 mt-2">
                  <span>{userData?.personalInfo?.email || "emma.grad@email.com"}</span>
                  <span>{userData?.personalInfo?.phone || "+27 83 987 6543"}</span>
                </div>
              </div>

              {/* Profile */}
              <div>
                <h2 className="text-sm font-semibold text-teal-600 mb-2">PROFILE</h2>
                <p className="text-xs text-gray-600">
                  {userData?.summary ||
                    "Motivated marketing graduate with strong digital marketing skills and internship experience. Seeking to leverage academic knowledge and creativity in an entry-level marketing position."}
                </p>
              </div>

              {/* Education */}
              <div>
                <h2 className="text-sm font-semibold text-teal-600 mb-2">EDUCATION</h2>
                {userData?.education && userData.education.length > 0 ? (
                  userData.education.map((edu, index) => (
                    <div key={index}>
                      <h3 className="text-xs font-medium text-gray-700">{edu.degree || "Degree"}</h3>
                      <p className="text-xs text-gray-500">
                        {edu.institution || "Institution"} • {edu.graduationDate || "Graduation Date"}
                      </p>
                      <p className="text-xs text-gray-600">{edu.location || "Location"}</p>
                    </div>
                  ))
                ) : (
                  <div>
                    <h3 className="text-xs font-medium text-gray-700">Bachelor of Commerce (Marketing)</h3>
                    <p className="text-xs text-gray-500">University of Witwatersrand • 2024</p>
                    <p className="text-xs text-gray-600 mt-1">Cum Laude • GPA: 3.8/4.0</p>
                    <p className="text-xs text-gray-600">
                      Relevant coursework: Digital Marketing, Consumer Behavior, Marketing Research
                    </p>
                  </div>
                )}
              </div>

              {/* Experience */}
              <div>
                <h2 className="text-sm font-semibold text-teal-600 mb-2">EXPERIENCE</h2>
                <div className="space-y-2">
                  {userData?.experience && userData.experience.length > 0 ? (
                    userData.experience.map((exp, index) => (
                      <div key={index}>
                        <h3 className="text-xs font-medium text-gray-700">{exp.title || "Job Title"}</h3>
                        <p className="text-xs text-gray-500">
                          {exp.company || "Company"} • {exp.startDate || "Start Date"}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{exp.description || "Job Description"}</p>
                      </div>
                    ))
                  ) : (
                    <>
                      <div>
                        <h3 className="text-xs font-medium text-gray-700">Marketing Intern</h3>
                        <p className="text-xs text-gray-500">Digital Agency • Summer 2023</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Assisted with social media campaigns that increased engagement by 25%. Created content for
                          various platforms.
                        </p>
                      </div>
                      <div>
                        <h3 className="text-xs font-medium text-gray-700">Campus Ambassador</h3>
                        <p className="text-xs text-gray-500">Student Brand • 2022-2023</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Promoted brand awareness on campus through events and social media.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div>
                <h2 className="text-sm font-semibold text-teal-600 mb-2">SKILLS</h2>
                <div className="flex flex-wrap gap-1">
                  {skillsArray.map((skill) => (
                    <span key={skill} className="px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case "digital":
        return (
          <div
            className={`bg-gradient-to-br from-blue-50 to-indigo-50 border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}
          >
            <div className="p-4 space-y-3">
              {/* Header with Avatar */}
              <div className="flex items-center gap-3 pb-3 border-b border-blue-200">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  JD
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">
                    {userData?.personalInfo?.fullName || "Jordan Digital"}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {userData?.personalInfo?.jobTitle || "Digital Portfolio Designer"}
                  </p>
                  <div className="flex gap-2 text-xs text-gray-500 mt-1">
                    <span>📧 {userData?.personalInfo?.email || "jordan@email.com"}</span>
                    {userData?.personalInfo?.phone && <span>📱 {userData.personalInfo.phone}</span>}
                  </div>
                </div>
              </div>

              {/* About */}
              <div>
                <h2 className="text-sm font-semibold text-indigo-600 mb-2">ABOUT</h2>
                <p className="text-xs text-gray-600">
                  {userData?.summary ||
                    "Digital designer specializing in creating stunning portfolios and interactive experiences. Combining visual design with technical expertise to build memorable digital presences."}
                </p>
              </div>

              {/* Portfolio Highlights */}
              <div>
                <h2 className="text-sm font-semibold text-indigo-600 mb-2">PORTFOLIO HIGHLIGHTS</h2>
                <div className="grid grid-cols-2 gap-2">
                  {userData?.experience && userData.experience.length > 0 ? (
                    userData.experience.map((exp, index) => (
                      <div key={index} className="bg-white/70 rounded p-2">
                        <div className="w-full h-8 bg-gradient-to-r from-pink-200 to-purple-200 rounded mb-1"></div>
                        <p className="text-xs font-medium">{exp.title || "Brand Identity"}</p>
                        <p className="text-xs text-gray-600">
                          {exp.description || "Visual identity for tech startups"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="bg-white/70 rounded p-2">
                        <div className="w-full h-8 bg-gradient-to-r from-pink-200 to-purple-200 rounded mb-1"></div>
                        <p className="text-xs font-medium">Brand Identity</p>
                        <p className="text-xs text-gray-600">Visual identity for tech startups</p>
                      </div>
                      <div className="bg-white/70 rounded p-2">
                        <div className="w-full h-8 bg-gradient-to-r from-green-200 to-blue-200 rounded mb-1"></div>
                        <p className="text-xs font-medium">Web Design</p>
                        <p className="text-xs text-gray-600">Interactive portfolio websites</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div>
                <h2 className="text-sm font-semibold text-indigo-600 mb-2">DIGITAL SKILLS</h2>
                <div className="flex flex-wrap gap-1">
                  {skillsArray.map((skill) => (
                    <span key={skill} className="px-2 py-1 bg-white/70 text-indigo-700 text-xs rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Contact */}
              <div className="bg-white/50 rounded p-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Available for freelance</span>
                  <span className="text-indigo-600 font-medium">Let's connect!</span>
                </div>
              </div>
            </div>
          </div>
        )

      case "sa-professional":
        return (
          <div className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
            <div className="p-6 space-y-4">
              {/* Header with South African flag colors accent */}
              <div className="border-l-4 border-l-green-600 pl-4 pb-4">
                <div className="flex justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">{userData?.personalInfo?.fullName || "Thabo Molefe"}</h1>
                    <p className="text-sm text-gray-600">
                      {userData?.personalInfo?.jobTitle || "Business Development Manager"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="h-1 w-16 bg-red-600 mb-0.5"></div>
                    <div className="h-1 w-16 bg-blue-600 mb-0.5"></div>
                    <div className="h-1 w-16 bg-green-600 mb-0.5"></div>
                    <div className="h-1 w-16 bg-yellow-500 mb-0.5"></div>
                    <div className="h-1 w-16 bg-black mb-0.5"></div>
                    <div className="h-1 w-16 bg-white mb-0.5"></div>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-gray-500 mt-2">
                  <span>{userData?.personalInfo?.email || "thabo.molefe@email.co.za"}</span>
                  <span>{userData?.personalInfo?.phone || "072 123 4567"}</span>
                  <span>{userData?.personalInfo?.location || "Johannesburg, Gauteng"}</span>
                </div>
                {userData?.personalInfo?.idNumber && (
                  <p className="text-xs text-gray-500 mt-1">ID: {userData.personalInfo.idNumber}</p>
                )}
                {userData?.personalInfo?.linkedIn && (
                  <p className="text-xs text-gray-500 mt-1">LinkedIn: {userData.personalInfo.linkedIn}</p>
                )}
              </div>

              {/* Professional Summary */}
              <div>
                <h2 className="text-sm font-semibold text-gray-800 mb-2">PROFESSIONAL SUMMARY</h2>
                <p className="text-xs text-gray-600">
                  {userData?.summary ||
                    "Results-driven Business Development Manager with 7+ years of experience in the South African market. Proven track record of expanding business opportunities and building strategic partnerships across multiple industries. Strong negotiation skills and deep understanding of local business landscape."}
                </p>
              </div>

              {/* Professional Registration */}
              {userData?.personalInfo?.professionalRegistration && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-800 mb-2">PROFESSIONAL REGISTRATION</h2>
                  <p className="text-xs text-gray-600">{userData.personalInfo.professionalRegistration}</p>
                </div>
              )}

              {/* Experience */}
              <div>
                <h2 className="text-sm font-semibold text-gray-800 mb-2">WORK EXPERIENCE</h2>
                <div className="space-y-3">
                  {userData?.experience && userData.experience.length > 0 ? (
                    userData.experience.map((exp, index) => (
                      <div key={index}>
                        <div className="flex justify-between">
                          <h3 className="text-xs font-medium text-gray-700">{exp.title || "Job Title"}</h3>
                          <span className="text-xs text-gray-500">
                            {exp.startDate || "Start Date"} - {exp.endDate || "End Date"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {exp.company || "Company"} • {exp.location || "Location"}
                        </p>
                        {exp.isLearnership && <p className="text-xs text-green-600 font-medium">Learnership</p>}
                        {exp.isInternship && <p className="text-xs text-blue-600 font-medium">Internship</p>}
                        <p className="text-xs text-gray-600 mt-1">{exp.description || "Job description"}</p>
                      </div>
                    ))
                  ) : (
                    <>
                      <div>
                        <div className="flex justify-between">
                          <h3 className="text-xs font-medium text-gray-700">Business Development Manager</h3>
                          <span className="text-xs text-gray-500">Jan 2020 - Present</span>
                        </div>
                        <p className="text-xs text-gray-500">ABC Solutions • Johannesburg</p>
                        <ul className="text-xs text-gray-600 mt-1 pl-4 list-disc">
                          <li>Increased company revenue by 35% through strategic partnerships with key South African businesses</li>
                          <li>Developed and implemented business strategies aligned with BEE requirements</li>
                          <li>Managed a team of 5 sales representatives across Gauteng province</li>
                        </ul>
                      </div>
                      <div>
                        <div className="flex justify-between">
                          <h3 className="text-xs font-medium text-gray-700">Sales Representative</h3>
                          <span className="text-xs text-gray-500">Mar 2017 - Dec 2019</span>
                        </div>
                        <p className="text-xs text-gray-500">XYZ Corporation • Cape Town</p>
                        <ul className="text-xs text-gray-600 mt-1 pl-4 list-disc">
                          <li>Consistently exceeded sales targets by 25% quarter-on-quarter</li>
                          <li>Built and maintained relationships with clients across Western Cape</li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Education */}
              <div>
                <h2 className="text-sm font-semibold text-gray-800 mb-2">EDUCATION</h2>
                <div className="space-y-2">
                  {userData?.education && userData.education.length > 0 ? (
                    userData.education.map((edu, index) => (
                      <div key={index}>
                        <div className="flex justify-between">
                          <h3 className="text-xs font-medium text-gray-700">{edu.degree || "Degree"}</h3>
                          <span className="text-xs text-gray-500">{edu.graduationDate || "Graduation Date"}</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {edu.institution || "Institution"} • {edu.location || "Location"}
                        </p>
                        {edu.nqfLevel && <p className="text-xs text-gray-600">NQF Level: {edu.nqfLevel}</p>}
                        {edu.saqa && <p className="text-xs text-gray-600">SAQA ID: {edu.saqa}</p>}
                      </div>
                    ))
                  ) : (
                    <div>
                      <div className="flex justify-between">
                        <h3 className="text-xs font-medium text-gray-700">BCom Business Management</h3>
                        <span className="text-xs text-gray-500">2016</span>
                      </div>
                      <p className="text-xs text-gray-500">University of Cape Town • Cape Town</p>
                      <p className="text-xs text-gray-600">NQF Level: 7</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Languages */}
              {userData?.personalInfo?.languages && userData.personalInfo.languages.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-800 mb-2">LANGUAGES</h2>
                  <p className="text-xs text-gray-600">{userData.personalInfo.languages.join(", ")}</p>
                </div>
              )}

              {/* Skills */}
              <div>
                <h2 className="text-sm font-semibold text-gray-800 mb-2">SKILLS</h2>
                <div className="flex flex-wrap gap-1">
                  {skillsArray.map((skill) => (
                    <span key={skill} className="px-2 py-1 bg-gray-100 text-xs rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case "sa-modern":
        return (
          <div className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4">
              <h1 className="text-lg font-bold">{userData?.personalInfo?.fullName || "Nomsa Dlamini"}</h1>
              <p className="text-sm opacity-90">{userData?.personalInfo?.jobTitle || "Marketing Specialist"}</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-4 text-xs text-gray-600">
                <span>{userData?.personalInfo?.email || "nomsa.dlamini@email.co.za"}</span>
                <span>{userData?.personalInfo?.phone || "083 765 4321"}</span>
                <span>{userData?.personalInfo?.location || "Pretoria, Gauteng"}</span>
              </div>

              {userData?.personalInfo?.idNumber && (
                <div>
                  <h2 className="text-sm font-semibold text-green-600 mb-1">ID Number</h2>
                  <p className="text-xs text-gray-600">{userData.personalInfo.idNumber}</p>
                </div>
              )}

              <div>
                <h2 className="text-sm font-semibold text-green-600 mb-2">About</h2>
                <p className="text-xs text-gray-600">
                  {userData?.summary ||
                    "Dynamic Marketing Specialist with expertise in digital marketing and brand development for the South African market. Skilled in creating culturally relevant campaigns that resonate with diverse South African audiences. Passionate about leveraging local insights to drive marketing success."}
                </p>
              </div>

              {userData?.personalInfo?.languages && userData.personalInfo.languages.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-green-600 mb-1">Languages</h2>
                  <div className="flex flex-wrap gap-2">
                    {userData.personalInfo.languages.map((language, index) => (
                      <span key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                        {language}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-sm font-semibold text-green-600 mb-2">Experience</h2>
                <div className="space-y-2">
                  {userData?.experience && userData.experience.length > 0 ? (
                    userData.experience.map((exp, index) => (
                      <div key={index} className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xs font-medium">{exp.title || "Job Title"}</h3>
                          <p className="text-xs text-gray-500">{exp.company || "Company"}</p>
                          {exp.isLearnership && <p className="text-xs text-green-600 font-medium">Learnership</p>}
                          {exp.isInternship && <p className="text-xs text-blue-600 font-medium">Internship</p>}
                          <p className="text-xs text-gray-600 mt-1">{exp.description || "Job description"}</p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {exp.startDate || "Start"}-{exp.endDate || "End"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xs font-medium">Marketing Specialist</h3>
                          <p className="text-xs text-gray-500">ABC Marketing Agency</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Led digital marketing campaigns for major South African brands, resulting in 40% increase in engagement
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">2021-Now</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xs font-medium">Marketing Assistant</h3>
                          <p className="text-xs text-gray-500">XYZ Company</p>
                          <p className="text-xs text-blue-600 font-medium">Internship</p>
                          <p className="text-xs text-gray-600 mt-1">
                            Assisted with social media management and content creation
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">2019-2021</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-green-600 mb-2">Education</h2>
                <div className="space-y-2">
                  {userData?.education && userData.education.length > 0 ? (
                    userData.education.map((edu, index) => (
                      <div key={index}>
                        <div className="flex justify-between">
                          <h3 className="text-xs font-medium">{edu.degree || "Degree"}</h3>
                          <span className="text-xs text-gray-400">{edu.graduationDate || "Year"}</span>
                        </div>
                        <p className="text-xs text-gray-500">{edu.institution || "Institution"}</p>
                        {edu.nqfLevel && <p className="text-xs text-gray-600">NQF Level: {edu.nqfLevel}</p>}
                      </div>
                    ))
                  ) : (
                    <div>
                      <div className="flex justify-between">
                        <h3 className="text-xs font-medium">BA Marketing Communications</h3>
                        <span className="text-xs text-gray-400">2019</span>
                      </div>
                      <p className="text-xs text-gray-500">University of Johannesburg</p>
                      <p className="text-xs text-gray-600">NQF Level: 7</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-green-600 mb-2">Skills</h2>
                <div className="grid grid-cols-2 gap-1">
                  {skillsArray.map((skill) => (
                    <div key={skill} className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                      <span className="text-xs">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case "sa-executive":
        return (
          <div className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
            <div className="bg-gray-900 text-white p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24">
                <div className="w-full h-1 bg-red-600"></div>
                <div className="w-full h-1 bg-blue-600"></div>
                <div className="w-full h-1 bg-green-600"></div>
                <div className="w-full h-1 bg-yellow-500"></div>
                <div className="w-full h-1 bg-black"></div>
                <div className="w-full h-1 bg-white"></div>
              </div>
              <h1 className="text-xl font-bold">{userData?.personalInfo?.fullName || "Sipho Nkosi"}</h1>
              <p className="text-sm opacity-90">{userData?.personalInfo?.jobTitle || "Chief Operations Officer"}</p>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-gray-600">{userData?.personalInfo?.email || "sipho.nkosi@company.co.za"}</p>
                </div>
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-gray-600">{userData?.personalInfo?.phone || "061 234 5678"}</p>
                </div>
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-gray-600">{userData?.personalInfo?.location || "Sandton, Johannesburg"}</p>
                </div>
                {userData?.personalInfo?.linkedIn && (
                  <div>
                    <p className="font-medium">LinkedIn</p>
                    <p className="text-gray-600">{userData.personalInfo.linkedIn}</p>
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-sm font-semibold text-gray-800 mb-2">EXECUTIVE PROFILE</h2>
                <p className="text-xs text-gray-600">
                  {userData?.summary ||
                    "Accomplished C-level executive with 15+ years of leadership experience in South African corporate environments. Expert in operational excellence, strategic planning, and business transformation. Proven track record of driving sustainable growth and implementing successful BEE strategies."}
                </p>
              </div>

              {userData?.personalInfo?.professionalRegistration && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-800 mb-2">PROFESSIONAL REGISTRATION</h2>
                  <p className="text-xs text-gray-600">{userData.personalInfo.professionalRegistration}</p>
                </div>
              )}

              <div>
                <h2 className="text-sm font-semibold text-gray-800 mb-2">LEADERSHIP EXPERIENCE</h2>
                <div className="space-y-3">
                  {userData?.experience && userData.experience.length > 0 ? (
                    userData.experience.map((exp, index) => (
                      <div key={index} className="border-l-2 border-gray-900 pl-3">
                        <h3 className="text-xs font-medium text-gray-700">{exp.title || "Job Title"}</h3>
                        <p className="text-xs text-gray-500">
                          {exp.company || "Company"} • {exp.startDate || "Start Date"} - {exp.endDate || "End Date"}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">{exp.description || "Job Description"}</p>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="border-l-2 border-gray-900 pl-3">
                        <h3 className="text-xs font-medium text-gray-700">Chief Operations Officer</h3>
                        <p className="text-xs text-gray-500">South African Holdings • 2018 - Present</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Led operational transformation resulting in 30% efficiency improvement and R50M annual savings.
                          Implemented BEE strategies that achieved Level 2 B-BBEE status.
                        </p>
                      </div>
                      <div className="border-l-2 border-gray-300 pl-3">
                        <h3 className="text-xs font-medium text-gray-700">Operations Director</h3>
                        <p className="text-xs text-gray-500">National Corporation • 2015 - 2018</p>
                        <p className="text-xs text-gray-600 mt-1">
                          Oversaw operations across 5 provinces with staff of 250+. Increased operational efficiency by 25%.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-gray-800 mb-2">EDUCATION</h2>
                <div className="space-y-2">
                  {userData?.education && userData.education.length > 0 ? (
                    userData.education.map((edu, index) => (
                      <div key={index}>
                        <h3 className="text-xs font-medium text-gray-700">{edu.degree || "Degree"}</h3>
                        <p className="text-xs text-gray-500">
                          {edu.institution || "Institution"} • {edu.graduationDate || "Graduation Date"}
                        </p>
                        {edu.nqfLevel && <p className="text-xs text-gray-600">NQF Level: {edu.nqfLevel}</p>}
                        {edu.internationalEquivalence && (
                          <p className="text-xs text-gray-600">International Equivalence: {edu.internationalEquivalence}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <>
                      <div>
                        <h3 className="text-xs font-medium text-gray-700">MBA</h3>
                        <p className="text-xs text-gray-500">University of Stellenbosch Business School • 2010</p>
                        <p className="text-xs text-gray-600">NQF Level: 9</p>
                      </div>
                      <div>
                        <h3 className="text-xs font-medium text-gray-700">BCom Honours</h3>
                        <p className="text-xs text-gray-500">University of the Witwatersrand • 2005</p>
                        <p className="text-xs text-gray-600">NQF Level: 8</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {userData?.personalInfo?.languages && userData.personalInfo.languages.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-800 mb-2">LANGUAGES</h2>
                  <p className="text-xs text-gray-600">{userData.personalInfo.languages.join(", ")}</p>
                </div>
              )}

              <div>
                <h2 className="text-sm font-semibold text-gray-800 mb-2">KEY COMPETENCIES</h2>
                <div className="space-y-1">
                  {skillsArray.map((skill, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-gray-900 rounded-full"></div>
                      <p className="text-xs text-gray-600">{skill}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case "compact":
        return (
          <div className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
            <div className="p-4">
              <div className="flex justify-between items-start border-b border-gray-300 pb-3 mb-3">
                <div>
                  <h1 className="text-base font-bold text-gray-900">{userData?.personalInfo?.fullName || "Lerato Mokoena"}</h1>
                  <p className="text-xs text-gray-600">{userData?.personalInfo?.jobTitle || "Operations Manager"}</p>
                </div>
                <div className="text-right text-xs text-gray-500 space-y-0.5">
                  <p>{userData?.personalInfo?.email || "lerato@email.co.za"}</p>
                  <p>{userData?.personalInfo?.phone || "082 345 6789"}</p>
                  <p>{userData?.personalInfo?.location || "Johannesburg"}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-3">
                  {userData?.summary && <p className="text-xs text-gray-600">{userData.summary}</p>}
                  <div>
                    <p className="text-xs font-bold text-gray-800 uppercase mb-1">Experience</p>
                    {(userData?.experience || []).slice(0,3).map((exp, i) => (
                      <div key={i} className="mb-2">
                        <div className="flex justify-between">
                          <p className="text-xs font-medium">{exp.title}</p>
                          <p className="text-xs text-gray-400">{exp.startDate}–{exp.endDate}</p>
                        </div>
                        <p className="text-xs text-gray-500">{exp.company}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 uppercase mb-1">Education</p>
                    {(userData?.education || []).slice(0,2).map((edu, i) => (
                      <div key={i} className="mb-1">
                        <p className="text-xs font-medium">{edu.degree || "BCom"}</p>
                        <p className="text-xs text-gray-500">{edu.institution || "University of Johannesburg"} · {edu.graduationDate || "2020"}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold text-gray-800 uppercase mb-1">Skills</p>
                    {skillsArray.slice(0,8).map(s => <p key={s} className="text-xs text-gray-600">• {s}</p>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case "chronological":
        return (
          <div className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
            <div className="p-5 space-y-3">
              <div className="text-center pb-3 border-b-2 border-gray-800">
                <h1 className="text-lg font-bold text-gray-900 uppercase tracking-wide">{userData?.personalInfo?.fullName || "Siphamandla Zulu"}</h1>
                <p className="text-xs text-gray-600 mt-1">
                  {[userData?.personalInfo?.email, userData?.personalInfo?.phone, userData?.personalInfo?.location].filter(Boolean).join(' | ') || "siphamandla@email.co.za | 071 234 5678 | Durban"}
                </p>
              </div>
              {userData?.summary && (
                <div>
                  <p className="text-xs font-bold uppercase text-gray-800 border-b border-gray-300 pb-0.5 mb-1">Profile</p>
                  <p className="text-xs text-gray-600">{userData.summary}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-bold uppercase text-gray-800 border-b border-gray-300 pb-0.5 mb-2">Work Experience</p>
                {(userData?.experience || [{title:'Accountant',company:'ABC Ltd',startDate:'2021',endDate:'Present',description:'Managed financial reporting and reconciliations.',location:'',isLearnership:false,isInternship:false}]).map((exp,i) => (
                  <div key={i} className="mb-2">
                    <div className="flex justify-between">
                      <p className="text-xs font-semibold">{exp.title}</p>
                      <p className="text-xs text-gray-500">{exp.startDate} – {exp.endDate}</p>
                    </div>
                    <p className="text-xs text-gray-500 italic">{exp.company}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{exp.description}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-800 border-b border-gray-300 pb-0.5 mb-2">Education</p>
                {(userData?.education || [{degree:'BCom Accounting',institution:'UKZN',graduationDate:'2020',location:'',nqfLevel:7,saqa:'',internationalEquivalence:''}]).map((edu,i) => (
                  <div key={i} className="mb-1">
                    <div className="flex justify-between">
                      <p className="text-xs font-semibold">{edu.degree}</p>
                      <p className="text-xs text-gray-500">{edu.graduationDate}</p>
                    </div>
                    <p className="text-xs text-gray-500 italic">{edu.institution}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-800 border-b border-gray-300 pb-0.5 mb-1">Skills</p>
                <p className="text-xs text-gray-600">{skillsArray.join(' · ') || 'Excel · SAP · Financial Reporting · Pastel'}</p>
              </div>
            </div>
          </div>
        )

      case "functional":
        return (
          <div className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
            <div className="p-5 space-y-3">
              <div className="pb-3 border-b border-gray-200">
                <h1 className="text-lg font-bold text-gray-900">{userData?.personalInfo?.fullName || "Ayanda Khumalo"}</h1>
                <p className="text-xs text-gray-600">{userData?.personalInfo?.jobTitle || "Career Changer | Project Coordinator"}</p>
                <p className="text-xs text-gray-500 mt-1">{userData?.personalInfo?.email || "ayanda@email.co.za"} · {userData?.personalInfo?.phone || "064 567 8901"}</p>
              </div>
              {userData?.summary && (
                <div>
                  <p className="text-xs font-bold uppercase text-gray-700 mb-1">Summary</p>
                  <p className="text-xs text-gray-600">{userData.summary}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-bold uppercase text-gray-700 mb-2">Core Competencies</p>
                <div className="grid grid-cols-2 gap-1">
                  {skillsArray.slice(0,8).map(s => (
                    <div key={s} className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-600 rounded-full flex-shrink-0"></div>
                      <p className="text-xs text-gray-700">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-700 mb-2">Relevant Experience</p>
                {(userData?.experience || []).slice(0,2).map((exp,i) => (
                  <div key={i} className="mb-2">
                    <p className="text-xs font-semibold">{exp.title} — {exp.company}</p>
                    <p className="text-xs text-gray-600">{exp.description}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-700 mb-1">Education</p>
                {(userData?.education || []).slice(0,1).map((edu,i) => (
                  <p key={i} className="text-xs text-gray-600">{edu.degree || 'National Diploma'} · {edu.institution || 'Tshwane University of Technology'} · {edu.graduationDate || '2018'}</p>
                ))}
              </div>
            </div>
          </div>
        )

      case "sidebar":
        return (
          <div className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
            <div className="flex h-full">
              <div className="w-1/3 bg-gray-800 text-white p-3 space-y-3">
                <div>
                  <h1 className="text-xs font-bold leading-tight">{userData?.personalInfo?.fullName || "Precious Ndlovu"}</h1>
                  <p className="text-xs opacity-75 mt-0.5">{userData?.personalInfo?.jobTitle || "HR Manager"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs opacity-60 uppercase font-bold">Contact</p>
                  <p className="text-xs opacity-80 break-all">{userData?.personalInfo?.email || "precious@email.co.za"}</p>
                  <p className="text-xs opacity-80">{userData?.personalInfo?.phone || "079 123 4567"}</p>
                  <p className="text-xs opacity-80">{userData?.personalInfo?.location || "Cape Town"}</p>
                </div>
                <div>
                  <p className="text-xs opacity-60 uppercase font-bold mb-1">Skills</p>
                  {skillsArray.slice(0,6).map(s => <p key={s} className="text-xs opacity-80">· {s}</p>)}
                </div>
                {userData?.personalInfo?.languages && userData.personalInfo.languages.length > 0 && (
                  <div>
                    <p className="text-xs opacity-60 uppercase font-bold mb-1">Languages</p>
                    {userData.personalInfo.languages.map(l => <p key={l} className="text-xs opacity-80">· {l}</p>)}
                  </div>
                )}
              </div>
              <div className="flex-1 p-3 space-y-3">
                {userData?.summary && <p className="text-xs text-gray-600">{userData.summary}</p>}
                <div>
                  <p className="text-xs font-bold uppercase text-gray-700 border-b border-gray-200 pb-0.5 mb-2">Experience</p>
                  {(userData?.experience || [{title:'HR Manager',company:'Retail Group',startDate:'2020',endDate:'Present',description:'Managed recruitment and employee relations.',location:'',isLearnership:false,isInternship:false}]).slice(0,3).map((exp,i) => (
                    <div key={i} className="mb-2">
                      <div className="flex justify-between">
                        <p className="text-xs font-semibold">{exp.title}</p>
                        <p className="text-xs text-gray-400">{exp.startDate}–{exp.endDate}</p>
                      </div>
                      <p className="text-xs text-gray-500">{exp.company}</p>
                      <p className="text-xs text-gray-600">{exp.description}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gray-700 border-b border-gray-200 pb-0.5 mb-1">Education</p>
                  {(userData?.education || [{degree:'BA Human Resources',institution:'UWC',graduationDate:'2019',location:'',nqfLevel:7,saqa:'',internationalEquivalence:''}]).slice(0,2).map((edu,i) => (
                    <div key={i} className="mb-1">
                      <p className="text-xs font-semibold">{edu.degree}</p>
                      <p className="text-xs text-gray-500">{edu.institution} · {edu.graduationDate}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case "matric":
        return (
          <div className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
            <div className="p-5 space-y-3">
              <div className="text-center pb-3 border-b border-gray-200">
                <h1 className="text-lg font-bold text-gray-900">{userData?.personalInfo?.fullName || "Thandeka Mthembu"}</h1>
                <p className="text-xs text-gray-600">{userData?.personalInfo?.jobTitle || "School Leaver | Seeking Learnership"}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {userData?.personalInfo?.email || "thandeka@gmail.com"} · {userData?.personalInfo?.phone || "073 456 7890"} · {userData?.personalInfo?.location || "Soweto, Gauteng"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-700 mb-1">Objective</p>
                <p className="text-xs text-gray-600">{userData?.summary || "Motivated Grade 12 graduate seeking a learnership or entry-level opportunity to develop practical skills and grow within a professional environment."}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-700 mb-2">Education</p>
                {(userData?.education || [{degree:'National Senior Certificate (Matric)',institution:'Soweto High School',graduationDate:'2024',location:'Soweto',nqfLevel:4,saqa:'',internationalEquivalence:''}]).map((edu,i) => (
                  <div key={i} className="mb-1">
                    <p className="text-xs font-semibold">{edu.degree || 'National Senior Certificate (Matric)'}</p>
                    <p className="text-xs text-gray-500">{edu.institution} · {edu.graduationDate}</p>
                    {edu.nqfLevel && <p className="text-xs text-gray-500">NQF Level {edu.nqfLevel}</p>}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-700 mb-1">Skills & Abilities</p>
                <div className="flex flex-wrap gap-1">
                  {(skillsArray.length > 0 ? skillsArray : ['Microsoft Office','Communication','Teamwork','Time Management','Customer Service']).map(s => (
                    <span key={s} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              </div>
              {userData?.experience && userData.experience.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase text-gray-700 mb-1">Experience / Volunteering</p>
                  {userData.experience.map((exp,i) => (
                    <div key={i} className="mb-1">
                      <p className="text-xs font-semibold">{exp.title} · {exp.company}</p>
                      <p className="text-xs text-gray-600">{exp.description}</p>
                    </div>
                  ))}
                </div>
              )}
              {userData?.personalInfo?.languages && userData.personalInfo.languages.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase text-gray-700 mb-1">Languages</p>
                  <p className="text-xs text-gray-600">{userData.personalInfo.languages.join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return (
          <div className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden ${className}`}>
            <div className="p-6 space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <h1 className="text-xl font-bold text-gray-900">
                  {userData?.personalInfo?.fullName || "Professional Name"}
                </h1>
                <p className="text-sm text-gray-600">{userData?.personalInfo?.jobTitle || "Job Title"}</p>
              </div>
              <div className="space-y-3">
                <p className="text-xs text-gray-600">
                  {userData?.summary ||
                    "Professional summary highlighting key qualifications and career objectives. Brief overview of skills and expertise relevant to the target position."}
                </p>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div id="cv-preview-container" className="relative h-full w-full bg-white">
      {getTemplateContent()}
    </div>
  )
}
