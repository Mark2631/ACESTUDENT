"use client";

import { useState } from "react";
import { ArrowRight, BookOpen, CheckCircle2, RotateCcw } from "lucide-react";

type Check = {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

type Lesson = {
  id: string;
  title: string;
  minutes: number;
  objectives: string[];
  sections: { heading: string; body: string }[];
  example: string;
  check: Check;
  source?: { label: string; url: string };
};

const lessonBank: Record<string, Lesson[]> = {
  BFB3200: [
    {
      id: "hr-planning",
      title: "Recruitment starts with workforce planning",
      minutes: 7,
      objectives: ["Distinguish workforce planning from recruitment", "Explain job analysis and a person specification", "Choose between internal and external sources"],
      sections: [
        { heading: "1. Identify the gap", body: "Human-resource planning estimates the people and capabilities an organisation will need, then compares that demand with the workforce it already has. A vacancy is not automatically a reason to hire: workload may be redesigned, staff trained, or a temporary peak handled through another arrangement." },
        { heading: "2. Define the work before advertising", body: "Job analysis gathers evidence about duties, responsibilities, working conditions and required capabilities. A job description explains the role and its outputs. A person specification describes the knowledge, skills, experience and attributes needed to perform it. Selection criteria should be relevant to the work and applied consistently." },
        { heading: "3. Select a recruitment source", body: "Internal recruitment can be faster, motivate existing employees and retain institutional knowledge, but it may limit the range of applicants. External recruitment can widen the talent pool and introduce new experience, but usually costs more and takes longer. The choice depends on urgency, available skills, fairness and the role." }
      ],
      example: "A Meru retailer plans to open a second branch. Before advertising for a supervisor, it estimates staffing needs, checks whether an existing employee is ready for promotion, writes measurable role requirements, and then chooses the fairest recruitment route.",
      check: { prompt: "Which document primarily states the duties and responsibilities of a role?", options: ["A job description", "A cash-flow statement", "An organisation's marketing plan", "A personal reference"], answer: 0, explanation: "A job description records the role's purpose, main duties, responsibilities and reporting relationships. A person specification describes the candidate requirements." },
      source: { label: "OpenStax · Human resource management", url: "https://openstax.org/books/principles-management/pages/11-1-an-introduction-to-human-resource-management" }
    },
    {
      id: "hr-development",
      title: "Training, performance and employee development",
      minutes: 8,
      objectives: ["Separate training from longer-term development", "Describe a basic performance-management cycle", "Evaluate whether an intervention worked"],
      sections: [
        { heading: "Training and development", body: "Training builds capabilities needed for current work; development prepares employees for broader or future responsibilities. Methods include coaching, demonstration, job rotation, mentoring, simulations and formal instruction. A method should match the skill, learner and workplace risk." },
        { heading: "Performance management", body: "Performance management is a continuing process, not just an annual form. Managers set clear expectations, agree measurable goals, observe work, give specific feedback, identify support needs and review progress. Goals should be connected to organisational objectives and within the employee's reasonable influence." },
        { heading: "Fairness and evaluation", body: "A good system uses job-related criteria, evidence from an appropriate period and a chance for the employee to respond. Training evaluation should look beyond attendance: check whether knowledge improved, behaviour changed at work and the intended organisational result followed." }
      ],
      example: "A SACCO introduces a digital loan system. Staff first practise the process in a safe training environment. Supervisors then observe actual applications, coach errors, and compare processing time and error rates before and after training.",
      check: { prompt: "Which is the strongest evidence that a training programme transferred into the workplace?", options: ["The number of people who attended", "A certificate issued to every attendee", "Observed improvement in job performance against a baseline", "The length of the training slides"], answer: 2, explanation: "Attendance shows participation, not effectiveness. Work-based behaviour and performance measures help establish whether learning was applied." },
      source: { label: "OpenStax · Principles of Management", url: "https://openstax.org/books/principles-management/pages/11-1-an-introduction-to-human-resource-management" }
    }
  ],
  BFB3201: [
    {
      id: "law-contract",
      title: "How a contract is formed",
      minutes: 9,
      objectives: ["Identify the main elements of a contract", "Distinguish an offer from an invitation to treat", "Apply the elements to a short business scenario"],
      sections: [
        { heading: "Start with agreement", body: "A contract is an agreement the law recognises as creating enforceable obligations. In a basic formation problem, ask whether there was a sufficiently clear offer, a valid acceptance of that offer, consideration where required, intention to create legal relations, capacity and a lawful purpose. The precise rules depend on the applicable legislation and case law." },
        { heading: "Offer and acceptance", body: "An offer communicates willingness to be bound on stated terms if accepted. An invitation to treat usually invites another person to make an offer; displaying goods in a shop is a common teaching example. Acceptance must correspond to the offer and be communicated in the manner the law recognises. A counter-offer normally changes the terms rather than accepting the original offer." },
        { heading: "Apply the facts", body: "Do not simply list legal terms in an examination answer. Identify the parties, quote the relevant facts, state the rule, apply it to the facts and reach a measured conclusion. Consider whether the agreement was varied, terminated or affected by a defence." }
      ],
      example: "A supplier emails a shop offering 100 desks at KSh 8,000 each, with delivery by 30 June. The shop replies, 'We accept, provided delivery is by 15 June.' That reply changes a material term and is generally analysed as a counter-offer, not an unqualified acceptance.",
      check: { prompt: "A reply accepts an offer but changes the agreed delivery date. What is it most likely to be?", options: ["An unqualified acceptance", "A counter-offer", "Consideration", "An invitation to treat"], answer: 1, explanation: "Changing a material term means the reply does not accept the original offer exactly; it is generally treated as a counter-offer." },
      source: { label: "Kenya Law · Law of Contract Act, Cap. 23", url: "https://www.kenyalaw.org/kl/fileadmin/pdfdownloads/Acts/LawofContractAct_Cap23.pdf" }
    },
    {
      id: "law-agency",
      title: "Agency and alternative dispute resolution",
      minutes: 8,
      objectives: ["Explain the principal–agent relationship", "Recognise actual and apparent authority", "Compare common dispute-resolution routes"],
      sections: [
        { heading: "Agency in business", body: "Agency is a relationship in which an agent acts on behalf of a principal and may affect the principal's legal relations with third parties. Authority can be express or implied from the role and circumstances. Apparent authority concerns a representation attributable to the principal that leads a third party reasonably to believe the agent has authority. An agent should act within authority and disclose material conflicts." },
        { heading: "Ratification", body: "A principal may sometimes adopt an unauthorised act after it has been done. Ratification is not automatic: the principal must generally have capacity, know the material facts, adopt the act as a whole and act within the applicable time and legal limits. Apply the exact requirements taught in your unit and current Kenyan authorities." },
        { heading: "Resolving disputes", body: "Negotiation lets parties seek agreement directly. Mediation uses a neutral facilitator to help them reach their own settlement. Arbitration submits a dispute to an arbitrator for a decision under the applicable agreement and law. Litigation asks a court to determine the dispute. Compare cost, speed, privacy, enforceability, suitability and the parties' need for a binding outcome." }
      ],
      example: "A branch manager signs a routine supply order. If ordering stock is part of the manager's role, the business may be bound even if the manager did not receive a separate written instruction for that particular order. The authority question depends on the role and what the business represented to the supplier.",
      check: { prompt: "Which process uses a neutral facilitator but normally leaves the settlement decision with the parties?", options: ["Mediation", "Litigation", "Arbitration", "Execution of a judgment"], answer: 0, explanation: "A mediator facilitates negotiation; the parties decide whether to settle. An arbitrator, unlike a mediator, is asked to decide the dispute." },
      source: { label: "Kenya Law · Legislation and case law", url: "https://new.kenyalaw.org/" }
    }
  ],
  BFB3202: [
    {
      id: "entre-opportunity",
      title: "From an idea to a validated opportunity",
      minutes: 8,
      objectives: ["Distinguish an idea from a market opportunity", "Test customer need before investing", "Use evidence to refine a value proposition"],
      sections: [
        { heading: "An opportunity solves a real problem", body: "An idea is a possibility; an opportunity exists when a meaningful customer problem, a reachable market and a workable way to create value come together. A useful starting point is to define one customer group, one problem and the situation in which the problem occurs." },
        { heading: "Test the riskiest assumptions", body: "Do not treat compliments or social-media likes as proof of demand. Interview potential users about recent behaviour, observe the current workaround, test a simple offer and ask for a concrete next step such as a booking, deposit or repeat use. Record what people actually do, not only what they say." },
        { heading: "Refine the value proposition", body: "State who the product serves, what problem it removes, what outcome it creates and why the customer would choose it over the current alternative. Then examine resources, skills, suppliers, regulations, costs and revenue assumptions before scaling." }
      ],
      example: "Instead of immediately building a large campus delivery platform, test one route and a narrow set of items. Record order frequency, delivery time, failed orders, willingness to pay and repeat purchases. Those observations determine whether the opportunity deserves more investment.",
      check: { prompt: "Which observation is stronger evidence of real customer demand?", options: ["A friend says the idea sounds exciting", "A post receives many likes", "Target customers repeatedly pay for and use a small pilot", "The founder personally likes the idea"], answer: 2, explanation: "Repeated paid use is behavioural evidence. It does not remove every risk, but it is more informative than opinions or attention alone." },
      source: { label: "OpenStax · Recognising entrepreneurial opportunities", url: "https://openstax.org/books/entrepreneurship/pages/5-1-entrepreneurial-opportunity" }
    },
    {
      id: "entre-feasibility",
      title: "Feasibility, costs and a business model",
      minutes: 8,
      objectives: ["Check market, operational and financial feasibility", "Describe the core parts of a business model", "Identify assumptions that need testing"],
      sections: [
        { heading: "Three feasibility questions", body: "Market feasibility asks whether a reachable group has a problem and will pay for the proposed solution. Operational feasibility asks whether the team can reliably deliver it with available skills, suppliers and processes. Financial feasibility asks whether realistic revenue can cover costs and finance the time between paying suppliers and receiving customer money." },
        { heading: "Map how the venture works", body: "A business model explains the customer segment, value proposition, channels, customer relationships, key activities, resources, partners, revenue streams and cost structure. The pieces must fit together. A low-price offer may fail if delivery and support costs are high." },
        { heading: "Use conservative assumptions", body: "Separate fixed costs from variable costs, estimate realistic sales volume and test what happens if demand is lower or costs rise. A break-even calculation is a starting point, not a guarantee of profit or cash availability." }
      ],
      example: "A student selling printed revision packs estimates the printing cost per pack, transport, packaging, unsold stock and the time spent preparing orders. A small pre-order batch can test both demand and the delivery process before buying large quantities.",
      check: { prompt: "Which question primarily tests operational feasibility?", options: ["Can we deliver the promised service consistently with our people and suppliers?", "Will the colour of the logo be popular?", "Can the founder avoid speaking to customers?", "Will sales automatically rise each month?"], answer: 0, explanation: "Operational feasibility checks whether the venture can actually deliver its value proposition with the resources, processes and capabilities available." },
      source: { label: "OpenStax · Feasibility analysis", url: "https://openstax.org/books/entrepreneurship/pages/11-3-conducting-a-feasibility-analysis" }
    }
  ],
  BFB3203: [
    {
      id: "lead-style",
      title: "Choosing a leadership approach",
      minutes: 7,
      objectives: ["Distinguish leadership from formal authority", "Match an approach to task and team readiness", "Explain why context matters"],
      sections: [
        { heading: "Leadership is influence", body: "Leadership involves influencing people towards a shared purpose. Formal authority can help coordinate work, but it does not automatically create trust, commitment or sound judgement. Credibility is built through competence, consistency, fairness and communication." },
        { heading: "Fit the approach to the situation", body: "A directive approach can be appropriate in an urgent safety incident or where a task is unfamiliar and tightly controlled. A participative approach can improve decisions when staff hold useful knowledge and there is time to consult. Delegation supports capable people when outcomes, authority and accountability are clear. No single style is best in every situation." },
        { heading: "Explain your choice", body: "When analysing a leadership scenario, identify urgency, risk, task complexity, team experience and the need for participation. Then explain why the chosen approach fits those conditions and what safeguards prevent misuse of power." }
      ],
      example: "During a machine failure, the supervisor gives immediate safety instructions. Once the site is safe, the supervisor asks operators to help identify the cause and agree preventive changes. The approach changes as the situation changes.",
      check: { prompt: "A team is experienced, the decision is not urgent and members hold specialist knowledge. Which approach is most likely to use that knowledge?", options: ["Participative leadership", "Permanent command without consultation", "Avoiding all decisions", "Delegating without clarifying outcomes"], answer: 0, explanation: "Participation can improve decisions when team members have relevant knowledge and there is time to consult. The leader remains accountable for the final decision." }
    },
    {
      id: "lead-motivation",
      title: "Motivation, delegation and accountability",
      minutes: 8,
      objectives: ["Distinguish delegation from abdication", "Set clear outcomes and decision rights", "Connect motivation to fair working conditions"],
      sections: [
        { heading: "Delegate the work, retain accountability", body: "Effective delegation specifies the desired result, boundaries, available resources, authority to act, reporting points and deadline. The person receiving the task needs enough discretion to complete it. A leader who gives responsibility without authority or support is setting the person up to fail." },
        { heading: "Understand motivation", body: "People may value fair pay, security, belonging, recognition, autonomy, growth and meaningful work differently. A manager should not assume that one reward motivates everyone. Ask what is blocking performance and distinguish capability problems from resource, role-clarity or motivation problems." },
        { heading: "Give useful feedback", body: "Feedback should describe observed behaviour, its impact and a specific next step. Recognise good performance with evidence. Address poor performance privately, fairly and promptly, giving the person a chance to explain relevant circumstances." }
      ],
      example: "A team leader assigns a staff member responsibility for a client follow-up process, provides access to the customer records, sets a response-time target and agrees a weekly review. The leader checks outcomes without taking back every routine decision.",
      check: { prompt: "Which is an essential part of effective delegation?", options: ["Giving responsibility but withholding necessary authority", "Defining the expected result, boundaries and resources", "Avoiding follow-up under every circumstance", "Transferring all accountability permanently"], answer: 1, explanation: "Delegation needs clear outcomes, authority, resources and review. The leader retains overall accountability." }
    }
  ],
  BFB3204: [
    {
      id: "english-audience",
      title: "Audience, purpose and business messages",
      minutes: 7,
      objectives: ["Identify the purpose and audience of a message", "Choose an appropriate tone and channel", "Write a clear call to action"],
      sections: [
        { heading: "Plan before writing", body: "A business message should make its purpose clear and give the reader the information needed to act. Identify the audience, their existing knowledge, the decision or action required, the appropriate tone and any time constraint. Choose email, memo, report, meeting or another channel according to the purpose and record needed." },
        { heading: "Use a reader-centred structure", body: "Put the main point early, organise supporting details logically and use headings or short paragraphs where useful. Prefer concrete words, active sentences and specific dates. Avoid unexplained abbreviations, vague instructions and unnecessary formality." },
        { heading: "Check mechanics and etiquette", body: "Review grammar, spelling, punctuation, names, numbers, attachments and recipient details. Keep confidential information with the intended audience. A polite tone does not compensate for an unclear request; state exactly what the reader should do and by when." }
      ],
      example: "Weak: 'Please deal with this soon.' Stronger: 'Please confirm the supplier's revised quotation by 3 p.m. on Thursday so procurement can prepare the purchase order.' The second message names the action, deadline and reason.",
      check: { prompt: "What makes the second message more effective?", options: ["It uses more words", "It names the action, deadline and purpose", "It avoids identifying the reader's task", "It uses an aggressive tone"], answer: 1, explanation: "The reader knows what to do, by when and why. Those details make the message actionable." }
    },
    {
      id: "english-reports",
      title: "Reports, agendas and minutes",
      minutes: 8,
      objectives: ["Explain the function of an executive summary", "Distinguish an agenda from minutes", "Structure a concise report"],
      sections: [
        { heading: "Business reports", body: "A report presents information for a defined purpose. A common structure includes a title, purpose or terms of reference, method where relevant, findings, analysis, conclusion and recommendations. The exact structure depends on the assignment. Separate evidence from opinion and cite sources for ideas or information that are not your own." },
        { heading: "Executive summaries", body: "An executive summary gives a decision-maker the purpose, most important findings and recommendations without requiring the full report to be read first. It is concise and evidence-based; it should not introduce claims that are absent from the report." },
        { heading: "Meetings", body: "An agenda is prepared before a meeting and sets out the items to be discussed, usually with relevant order and time. Minutes are the record made during or after the meeting: decisions, actions, responsible people and deadlines. Minutes are not a transcript of every sentence spoken." }
      ],
      example: "A project committee agenda might include approval of the previous minutes, review of expenditure, progress against milestones, risks requiring a decision, and action items. The minutes then record what was decided and who will do each action.",
      check: { prompt: "Which document records decisions and action owners after a meeting?", options: ["The agenda", "The minutes", "The invitation", "The attendance reminder"], answer: 1, explanation: "Minutes record what happened, including decisions and actions. The agenda is the plan for what the meeting intends to discuss." }
    }
  ],
  BFB3205: [
    {
      id: "pr-publics",
      title: "Public relations begins with publics and objectives",
      minutes: 8,
      objectives: ["Distinguish public relations from advertising", "Identify relevant stakeholder publics", "Write a measurable communication objective"],
      sections: [
        { heading: "Relationships, not just publicity", body: "Public relations is the planned management of communication and relationships between an organisation and the groups that affect or are affected by it. These groups may include employees, customers, communities, regulators, suppliers, investors and the media. Different publics have different interests and information needs." },
        { heading: "Set an objective before choosing a channel", body: "A communication objective describes the change sought in a defined audience. It might concern awareness, understanding, trust, participation or a specific action. Define a baseline, a target, a timeframe and a way to measure the result. 'Post more often' is an activity, not an outcome." },
        { heading: "Choose a suitable message", body: "The message should be accurate, consistent with evidence and suitable for the audience. Select channels based on audience access, urgency, complexity, credibility and the opportunity for feedback. Two-way communication matters: organisations should listen, respond and correct inaccurate information." }
      ],
      example: "A university plans a new transport route. Students need route and safety details, residents need information about traffic, staff need operating procedures and regulators may require compliance evidence. One generic social post will not meet every group's needs.",
      check: { prompt: "Which is a measurable communication objective?", options: ["Make the organisation look better", "Publish many posts", "Increase correct awareness of the new service among first-year students from 40% to 70% by the end of the month", "Use every available channel"], answer: 2, explanation: "It names the audience, desired change, baseline, target and timeframe. The other options are vague or describe activity." }
    },
    {
      id: "pr-crisis",
      title: "Crisis communication and evaluation",
      minutes: 8,
      objectives: ["Prioritise accuracy and speed during an incident", "Identify an appropriate spokesperson", "Evaluate outcomes and learn from feedback"],
      sections: [
        { heading: "Prepare before the crisis", body: "A crisis plan identifies likely risks, decision-makers, spokespersons, approval routes, audiences, channels and holding procedures. Prepare facts and escalation routes, not scripted claims that may turn out to be false." },
        { heading: "Respond with discipline", body: "A responsible response acknowledges what is known, states what is not yet confirmed, explains what the organisation is doing and tells affected people where to get updates. Correct errors promptly. Avoid speculation, blame-shifting and promises that cannot be supported." },
        { heading: "Evaluate the response", body: "Measure outputs such as reach separately from outcomes such as audience understanding, trust, behaviour or resolution of concerns. Review questions received, response time, accuracy, corrections and lessons for the next incident." }
      ],
      example: "If a company discovers a possible data incident, it should follow legal and security procedures, communicate verified facts through authorised channels, explain protective steps and update affected groups as the investigation develops.",
      check: { prompt: "During an unfolding crisis, what should an organisation communicate?", options: ["Unverified explanations to fill every information gap", "Verified facts, immediate actions and when the next update will be given", "A promise that nothing harmful happened before investigation", "Conflicting statements from several unofficial accounts"], answer: 1, explanation: "Acknowledge uncertainty, provide verified information and protective actions, and set a clear update process." }
    }
  ],
  BFC3227: [
    {
      id: "cost-cvp",
      title: "Cost behaviour, contribution and break-even",
      minutes: 9,
      objectives: ["Separate fixed and variable costs", "Calculate contribution per unit", "Calculate break-even output and explain its assumptions"],
      sections: [
        { heading: "Understand cost behaviour", body: "A fixed cost stays constant in total within a relevant activity range and period, even when output changes. A variable cost changes in total with activity; the variable cost per unit is often assumed constant for a simple model. Mixed costs contain both fixed and variable elements." },
        { heading: "Calculate contribution", body: "Contribution per unit = selling price per unit − variable cost per unit. Total contribution first covers fixed costs; any remaining amount contributes to profit. Contribution is not the same as profit because fixed costs still need to be covered." },
        { heading: "Find the break-even point", body: "Break-even units = total fixed costs ÷ contribution per unit. The formula assumes a stable selling price and variable cost per unit, a relevant fixed-cost range, and (for multiple products) a stable sales mix. Real decisions should consider capacity, demand, stock and cash timing too." }
      ],
      example: "A printer sells for KSh 1,200. Variable cost is KSh 700 per unit and fixed costs are KSh 100,000. Contribution is KSh 500 per unit, so break-even output is 100,000 ÷ 500 = 200 printers. This is a planning estimate under the stated assumptions.",
      check: { prompt: "A product sells for KSh 900 and has a variable cost of KSh 540. What is its contribution per unit?", options: ["KSh 360", "KSh 540", "KSh 900", "KSh 1,440"], answer: 0, explanation: "Contribution per unit = selling price − variable cost = 900 − 540 = KSh 360." },
      source: { label: "OpenStax · Break-even analysis", url: "https://openstax.org/books/principles-managerial-accounting/pages/3-2-calculate-a-break-even-point-in-units-and-dollars" }
    },
    {
      id: "cost-overhead",
      title: "Overheads and product-cost decisions",
      minutes: 8,
      objectives: ["Distinguish direct costs from indirect costs", "Explain overhead allocation", "Avoid treating allocated cost as avoidable cost"],
      sections: [
        { heading: "Trace what can be traced", body: "Direct materials and direct labour can be economically traced to a cost object such as a product, job or service. Indirect costs support more than one cost object and are treated as overhead. The same cost can be direct in one context and indirect in another." },
        { heading: "Allocate overhead systematically", body: "A predetermined overhead absorption rate is commonly calculated as estimated overhead divided by an estimated activity base, such as labour hours or machine hours. Apply the rate to the actual activity used by a job. The result is an allocation estimate, not necessarily the exact overhead caused by that job." },
        { heading: "Choose the right cost for the decision", body: "A decision should focus on relevant future costs and benefits that differ between alternatives. A historic cost already incurred is sunk. An allocated fixed overhead may remain unchanged if one product is stopped, so it is not automatically an avoidable saving. Include opportunity costs where capacity could be used elsewhere." }
      ],
      example: "A bakery allocates electricity and equipment maintenance using machine hours. That may be useful for product costing, but when deciding whether to accept one extra order, the manager should also identify the additional ingredients, labour, energy, capacity constraints and any opportunity cost.",
      check: { prompt: "Which cost is normally irrelevant to a choice between two future alternatives because it has already been incurred?", options: ["A sunk cost", "An avoidable future cost", "An opportunity cost", "A future variable cost"], answer: 0, explanation: "A sunk cost is past and cannot be changed by the current decision. Relevant-cost analysis focuses on future amounts that differ between alternatives." },
      source: { label: "OpenStax · Managerial accounting", url: "https://openstax.org/books/principles-managerial-accounting/pages/3-2-calculate-a-break-even-point-in-units-and-dollars" }
    }
  ]
};

export default function CourseLessons({ code }: { code: string }) {
  const lessons = lessonBank[code] ?? [];
  const [activeId, setActiveId] = useState(lessons[0]?.id ?? "");
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const active = lessons.find((lesson) => lesson.id === activeId) ?? lessons[0];

  function chooseLesson(id: string) {
    setActiveId(id);
    setChoice(null);
    setChecked(false);
  }

  if (!lessons.length) return null;

  return (
    <section className="course-lessons">
      <div className="row course-lessons-heading">
        <div>
          <div className="eyebrow"><BookOpen size={14} /> LEARN A CONCEPT</div>
          <h2>Guided lessons</h2>
          <p className="muted">Short, original study guides with examples and a knowledge check. These are Ace Student learning notes, not official lecturer notes.</p>
        </div>
        <span className="small">{lessons.length} lessons</span>
      </div>
      <div className="lesson-picker">
        {lessons.map((lesson, index) => (
          <button key={lesson.id} type="button" className={active?.id === lesson.id ? "lesson-choice active" : "lesson-choice"} onClick={() => chooseLesson(lesson.id)}>
            <span>0{index + 1}</span>
            <strong>{lesson.title}</strong>
            <small>{lesson.minutes} min</small>
          </button>
        ))}
      </div>
      {active && (
        <article className="panel lesson-detail">
          <div className="eyebrow">{code} · {active.minutes} MINUTE LESSON</div>
          <h3>{active.title}</h3>
          <div className="lesson-objectives">
            <strong>By the end, you should be able to:</strong>
            <ul>{active.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>
          </div>
          {active.sections.map((section, index) => (
            <section className="lesson-section" key={section.heading}>
              <h4>{index + 1}. {section.heading}</h4>
              <p>{section.body}</p>
            </section>
          ))}
          <div className="lesson-example">
            <strong>Worked example</strong>
            <p>{active.example}</p>
          </div>
          <div className="lesson-check">
            <div className="eyebrow">CHECK YOUR UNDERSTANDING</div>
            <h4>{active.check.prompt}</h4>
            <div className="quiz-options">
              {active.check.options.map((option, index) => (
                <button key={option} type="button" className={choice === index ? "selected" : ""} aria-pressed={choice === index} onClick={() => { setChoice(index); setChecked(false); }}>
                  <span>{String.fromCharCode(65 + index)}</span>{option}
                </button>
              ))}
            </div>
            <div className="row lesson-check-actions">
              {checked && <span className={choice === active.check.answer ? "correct" : "muted"}>{choice === active.check.answer ? "Correct" : "Review the explanation"}</span>}
              <button className="btn" type="button" disabled={choice === null} onClick={() => setChecked(true)}>Check answer <ArrowRight size={15} /></button>
            </div>
            {checked && <div className="lesson-feedback"><p><strong>Answer: {active.check.options[active.check.answer]}</strong></p><p className="muted">{active.check.explanation}</p></div>}
          </div>
          <div className="lesson-footer">
            {active.source && <a href={active.source.url} target="_blank" rel="noopener noreferrer">{active.source.label} <ArrowRight size={14} /></a>}
            <button className="text-link" type="button" onClick={() => { setChoice(null); setChecked(false); }}> <RotateCcw size={14} /> Reset check</button>
          </div>
        </article>
      )}
      <p className="small">Use these guides to understand concepts, then compare them with your current lecturer's outline and approved course materials. Legal content should be checked against current Kenyan law.</p>
    </section>
  );
}
