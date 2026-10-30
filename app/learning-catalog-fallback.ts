// Small universal learning taxonomy used when public discovery is unavailable.
// These are navigation subjects, not fabricated university courses or learning documents.
export const FALLBACK_AREAS=[
 {slug:"business-enterprise",title:"Business & enterprise",description:"Management, finance, markets and entrepreneurship",sort_order:1},
 {slug:"computing-technology",title:"Computing & technology",description:"Programming, data, security and digital systems",sort_order:2},
 {slug:"natural-sciences",title:"Natural sciences",description:"Biology, chemistry, physics and the environment",sort_order:3},
 {slug:"engineering-design",title:"Engineering & design",description:"Built environments, manufacturing and creative problem-solving",sort_order:4},
 {slug:"law-policy",title:"Law & public policy",description:"Justice, governance, rights and public institutions",sort_order:5},
 {slug:"health-wellbeing",title:"Health & wellbeing",description:"Healthcare, public health and human behaviour",sort_order:6},
 {slug:"humanities-languages",title:"Humanities & languages",description:"History, philosophy, culture and communication",sort_order:7},
 {slug:"creative-media",title:"Creative arts & media",description:"Visual design, storytelling, music and digital media",sort_order:8}
] as const;
export const FALLBACK_SUBJECTS=[
 {slug:"accounting",title:"Accounting",description:"Financial statements, reporting and cost analysis",parent_slug:"business-enterprise",keywords:["accounts","cost","financial"]},
 {slug:"economics",title:"Economics",description:"Markets, incentives, macroeconomics and policy",parent_slug:"business-enterprise",keywords:["demand","supply","markets"]},
 {slug:"management",title:"Management",description:"Strategy, organizations, leadership and people",parent_slug:"business-enterprise",keywords:["leadership","management"]},
 {slug:"entrepreneurship",title:"Entrepreneurship",description:"Ventures, business models and customers",parent_slug:"business-enterprise",keywords:["startup","business"]},
 {slug:"programming",title:"Programming",description:"Build software and strengthen computational thinking",parent_slug:"computing-technology",keywords:["code","javascript","python"]},
 {slug:"data-science",title:"Data science",description:"Statistics, analysis and machine learning",parent_slug:"computing-technology",keywords:["statistics","machine learning"]},
 {slug:"cybersecurity",title:"Cybersecurity",description:"Network security, privacy and digital safety",parent_slug:"computing-technology",keywords:["security","privacy"]},
 {slug:"biology",title:"Biology",description:"Cells, life processes and ecosystems",parent_slug:"natural-sciences",keywords:["cells","ecosystem"]},
 {slug:"physics",title:"Physics",description:"Motion, matter, energy and measurement",parent_slug:"natural-sciences",keywords:["motion","energy"]},
 {slug:"chemistry",title:"Chemistry",description:"Atoms, molecules, reactions and materials",parent_slug:"natural-sciences",keywords:["atoms","reaction"]},
 {slug:"engineering",title:"Engineering",description:"Design, analysis and practical systems",parent_slug:"engineering-design",keywords:["engineering","design"]},
 {slug:"architecture",title:"Architecture",description:"Buildings, spaces and the built environment",parent_slug:"engineering-design",keywords:["buildings","design"]},
 {slug:"law",title:"Law",description:"Legal principles, reasoning and institutions",parent_slug:"law-policy",keywords:["law","legal"]},
 {slug:"public-policy",title:"Public policy",description:"Governance, institutions and public decisions",parent_slug:"law-policy",keywords:["policy","government"]},
 {slug:"public-health",title:"Public health",description:"Population health, prevention and care systems",parent_slug:"health-wellbeing",keywords:["health","prevention"]},
 {slug:"psychology",title:"Psychology",description:"Mind, behaviour, cognition and learning",parent_slug:"health-wellbeing",keywords:["behaviour","cognition"]},
 {slug:"history",title:"History",description:"People, societies and historical evidence",parent_slug:"humanities-languages",keywords:["history","society"]},
 {slug:"communication",title:"Communication",description:"Language, expression and professional writing",parent_slug:"humanities-languages",keywords:["writing","language"]},
 {slug:"visual-design",title:"Visual design",description:"Composition, typography and visual systems",parent_slug:"creative-media",keywords:["design","typography"]},
 {slug:"media-production",title:"Media production",description:"Video, sound and digital storytelling",parent_slug:"creative-media",keywords:["video","audio","media"]}
] as const;
