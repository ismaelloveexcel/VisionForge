import { Tool } from "@langchain/core/tools";

interface LawSection {
  id: string;
  title: string;
  category: string;
  content: string;
  reference: string;
  keywords: string[];
}

const UAE_LABOR_LAW_KNOWLEDGE_BASE: LawSection[] = [
  {
    id: "gratuity-1",
    title: "End of Service Gratuity - Basic Calculation",
    category: "Gratuity",
    content: `End of Service Gratuity (EOSG) calculation under Federal Decree-Law No. 33/2021:

For employees who have completed 1 year or more of continuous service:
- First 5 years: 21 days of basic salary for each year
- After 5 years: 30 days of basic salary for each additional year

Important notes:
- Only basic salary is used (excludes allowances, bonuses, overtime)
- Maximum gratuity cannot exceed 2 years' worth of total basic salary
- Pro-rata calculation applies for incomplete years
- Gratuity applies to both limited and unlimited contracts`,
    reference: "Federal Decree-Law No. 33/2021, Articles 51-53",
    keywords: ["gratuity", "end of service", "calculation", "basic salary", "21 days", "30 days"]
  },
  {
    id: "gratuity-2",
    title: "Gratuity Reduction for Resignation",
    category: "Gratuity",
    content: `Gratuity reduction rules when employee resigns (unlimited contracts):

- Less than 1 year service: No gratuity entitled
- 1-3 years service: 1/3 of calculated gratuity
- 3-5 years service: 2/3 of calculated gratuity
- 5+ years service: Full gratuity

For LIMITED contracts:
- Employee receives full gratuity regardless of who terminates
- No reduction applies for resignation

2024-2025 Update: Unlimited contracts are being phased out. New contracts must be limited-term (1-3 years, renewable).`,
    reference: "Federal Decree-Law No. 33/2021, Article 51",
    keywords: ["resignation", "reduction", "unlimited contract", "limited contract", "1/3", "2/3"]
  },
  {
    id: "working-hours",
    title: "Working Hours and Overtime",
    category: "Working Hours",
    content: `Standard working hours under UAE Labour Law:

Regular hours:
- Maximum 8 hours per day
- Maximum 48 hours per week
- During Ramadan: Reduced by 2 hours (6 hours/day)

Overtime:
- Maximum 2 hours overtime per day
- Overtime rate: 125% of regular hourly wage
- Night shift overtime (9 PM - 4 AM): 150% of regular hourly wage
- Friday work (rest day): 150% of regular hourly wage OR day off in lieu

Exempt from overtime rules:
- Senior management positions
- Employees in positions of trust
- Maritime workers (special regulations apply)`,
    reference: "Federal Decree-Law No. 33/2021, Articles 17-19",
    keywords: ["working hours", "overtime", "ramadan", "48 hours", "8 hours", "125%", "150%"]
  },
  {
    id: "annual-leave",
    title: "Annual Leave Entitlements",
    category: "Leave",
    content: `Annual leave entitlements under UAE Labour Law:

Entitlement based on service:
- First 6 months: 2 days per month (if employment ends, pro-rata applies)
- After 6 months but less than 1 year: Pro-rata of 30 days
- After 1 year: 30 calendar days per year

Key rules:
- Leave must be taken during the year (can carry forward with employer agreement)
- Employer determines leave timing but must grant within 6 months of earning
- Public holidays falling within leave are not counted as leave days
- Employee can request to encash unused leave upon termination
- Part-time workers: Pro-rata based on hours worked

Leave salary: Paid at basic salary plus regular allowances`,
    reference: "Federal Decree-Law No. 33/2021, Articles 29-31",
    keywords: ["annual leave", "30 days", "vacation", "holiday", "entitlement", "carry forward"]
  },
  {
    id: "sick-leave",
    title: "Sick Leave Entitlements",
    category: "Leave",
    content: `Sick leave entitlements under UAE Labour Law:

After completing 3 months probation:
- First 15 days: Full pay (100% of basic salary)
- Next 30 days: Half pay (50% of basic salary)
- Additional 45 days: Unpaid leave

Total sick leave: Up to 90 days per year (consecutive or intermittent)
Breakdown: 15 days full pay + 30 days half pay + 45 days unpaid = 90 days total

Requirements:
- Medical certificate from approved medical facility required
- Employer must be notified within 3 days
- Employer can request medical examination by own doctor

Exceptions:
- Illness during probation: No sick pay, but job protected
- Work-related injury: Full pay, no time limit (covered separately)
- Chronic illness: May require fitness assessment`,
    reference: "Federal Decree-Law No. 33/2021, Article 31",
    keywords: ["sick leave", "medical", "15 days", "half pay", "full pay", "90 days", "45 days"]
  },
  {
    id: "maternity-leave",
    title: "Maternity Leave",
    category: "Leave",
    content: `Maternity leave entitlements under UAE Labour Law:

Standard entitlement:
- 60 days maternity leave total:
  - First 45 days: Full pay
  - Next 15 days: Half pay
- Must be taken consecutively around delivery date

Additional provisions:
- Can start up to 30 days before expected delivery
- If complications or child illness: Additional 45 days unpaid
- Nursing breaks: 2 breaks per day (30 mins each) for 6 months after birth
- Cannot be terminated during maternity leave or due to pregnancy

Partner/Paternity leave:
- 5 working days paid leave for fathers
- Must be taken within first 6 months of birth`,
    reference: "Federal Decree-Law No. 33/2021, Articles 30, 32",
    keywords: ["maternity", "pregnancy", "60 days", "45 days", "nursing", "paternity", "parental"]
  },
  {
    id: "emiratisation",
    title: "Emiratisation Requirements",
    category: "Emiratisation",
    content: `Emiratisation requirements for private sector:

2024-2025 Targets:
- Companies with 50+ skilled employees: Must have 2% Emiratis
- Annual increase: 2% more each year until 10% achieved
- Deadline for 10%: 2026

Penalties for non-compliance:
- AED 7,000 per missing Emirati per month (2024)
- AED 8,000 per missing Emirati per month (2025)
- Escalating penalties for repeated non-compliance

Key sectors with higher requirements:
- Banking and financial services
- Insurance
- Real estate
- Healthcare management

Benefits for compliance:
- Reduced visa costs
- Priority for government contracts
- Tax incentives for Emirati training programs`,
    reference: "Cabinet Resolution No. 18/2022, Ministerial Resolution 279/2022",
    keywords: ["emiratisation", "quota", "2%", "penalty", "emirati", "skilled workers", "private sector"]
  },
  {
    id: "termination",
    title: "Termination of Employment",
    category: "Termination",
    content: `Termination rules under UAE Labour Law:

Notice periods (both employer and employee):
- Probation: 14 days notice (30 days if leaving UAE)
- After probation: 30-90 days as per contract (minimum 30 days)

Immediate termination without notice (by employer):
- Assault on employer, colleagues, or superiors
- Fraud, theft, or embezzlement
- Disclosure of confidential information
- Repeated failure to perform duties after written warning
- Working under influence of alcohol/drugs
- Absence for 20+ consecutive days or 30+ intermittent days without valid reason

Immediate termination by employee:
- Employer assault
- Employer breach of contract
- Unsafe working conditions
- Assignment of fundamentally different work

Arbitrary dismissal:
- Compensation of up to 3 months' wages if dismissal without valid reason
- In addition to any outstanding entitlements`,
    reference: "Federal Decree-Law No. 33/2021, Articles 42-47",
    keywords: ["termination", "notice period", "dismissal", "arbitrary", "resignation", "30 days", "90 days"]
  },
  {
    id: "probation",
    title: "Probation Period",
    category: "Employment",
    content: `Probation period rules under UAE Labour Law:

Duration:
- Maximum 6 months
- Cannot be extended or renewed
- Must be explicitly stated in employment contract

Termination during probation:
- By employer: 14 days written notice
- By employee: 14 days written notice (30 days if leaving UAE)
- By employee to join another UAE employer: 1 month written notice

Important:
- No gratuity if terminated during probation
- Sick leave during probation: Unpaid, but job protected
- Annual leave: Does not accrue during probation (starts after 6 months)

If probation not mentioned in contract: Employee is considered permanent from day 1`,
    reference: "Federal Decree-Law No. 33/2021, Articles 9-10",
    keywords: ["probation", "6 months", "trial period", "14 days", "notice", "termination"]
  },
  {
    id: "wages",
    title: "Wage Payment and Protection",
    category: "Wages",
    content: `Wage protection rules under UAE Labour Law:

Payment requirements:
- Wages must be paid through Wages Protection System (WPS)
- Payment within 10 days of due date
- Payment in UAE Dirhams
- Cannot pay less than agreed contract amount

Wage components:
- Basic salary (used for gratuity calculations)
- Allowances (housing, transport, etc.)
- Commissions and bonuses (if contractual)

Deductions (maximum 50% of total wage):
- Employee debts to employer (with court order)
- Social security contributions
- Court-ordered deductions
- Provident fund contributions (if agreed)

Delayed wages:
- Employee can file complaint with MOHRE
- Penalties for employer: Fines and potential visa ban
- Repeated delays: Criminal prosecution possible`,
    reference: "Federal Decree-Law No. 33/2021, Articles 22-27",
    keywords: ["wages", "salary", "WPS", "payment", "deductions", "basic salary", "allowances"]
  },
  {
    id: "part-time",
    title: "Part-Time Employment",
    category: "Employment",
    content: `Part-time work regulations under UAE Labour Law:

Definition:
- Work performed for one or more employers for fewer hours than full-time
- May be arranged by hour, day, or task

Requirements:
- Written contract specifying working hours
- Pro-rata entitlements for leave and benefits
- Must not exceed 48 hours per week across all employers

Benefits calculation:
- Annual leave: Pro-rata based on hours/days worked
- Sick leave: Pro-rata based on hours/days worked
- Gratuity: Pro-rata based on hours/days worked

Part-time visa:
- Employees can work for multiple employers
- Each employer must have work permit for the employee
- Main employer sponsors residence visa`,
    reference: "Federal Decree-Law No. 33/2021, Article 7",
    keywords: ["part-time", "flexible work", "multiple employers", "pro-rata", "hours"]
  },
  {
    id: "remote-work",
    title: "Remote Work and Flexible Arrangements",
    category: "Employment",
    content: `Remote and flexible work under UAE Labour Law:

Work models permitted:
- Full-time (traditional office-based)
- Part-time
- Temporary work
- Flexible work
- Job sharing
- Compressed work week
- Remote/work from home

Requirements for remote work:
- Written agreement between employer and employee
- Must specify:
  - Working hours
  - Rest periods
  - Equipment provision
  - Communication protocols
  - Data protection measures

Employer obligations:
- Provide necessary equipment (or compensation)
- Respect right to disconnect outside working hours
- Maintain workplace health and safety standards
- Same entitlements as office-based employees`,
    reference: "Federal Decree-Law No. 33/2021, Articles 7, 14-16",
    keywords: ["remote work", "work from home", "flexible", "job sharing", "compressed week", "WFH"]
  },
  {
    id: "discrimination",
    title: "Anti-Discrimination and Equal Treatment",
    category: "Workplace Rights",
    content: `Anti-discrimination provisions under UAE Labour Law:

Protected characteristics:
- Gender
- Race
- Color
- Religion
- National origin
- Social origin
- Disability

Prohibited actions:
- Discrimination in hiring, wages, training, or termination
- Sexual harassment
- Bullying or psychological harm
- Any form of forced labor

Equal pay:
- Women entitled to equal pay for equal work
- No discrimination in wages based on gender

Enforcement:
- Complaints can be filed with MOHRE
- Fines for employers found guilty
- Employee can seek compensation through courts
- Whistleblower protection for reporting violations`,
    reference: "Federal Decree-Law No. 33/2021, Articles 4-6",
    keywords: ["discrimination", "equal pay", "harassment", "gender", "race", "religion", "bullying"]
  },
  {
    id: "visa-work-permit",
    title: "Visa and Work Permit Requirements",
    category: "Employment",
    content: `Employment visa requirements in UAE:

Work permit requirements:
- Employer must obtain work permit before employee enters UAE
- Medical fitness test required
- Emirates ID mandatory
- Valid passport with minimum 6 months validity

Visa types:
- Employment visa (standard, 2-3 years)
- Green visa (for skilled workers, 5 years)
- Golden visa (for executives/specialists, 10 years)

Employment ban (cooling-off period):
- Abolished for most categories (2022 reform)
- Exception: Employee terminated for Article 44 violations (6 months ban)

Visa cancellation:
- Must be done within 30 days of employment end
- 30-day grace period to leave UAE or find new sponsor
- Absconding carries serious penalties`,
    reference: "Cabinet Resolution No. 1/2022, MOHRE Regulations",
    keywords: ["visa", "work permit", "emirates ID", "employment ban", "green visa", "golden visa"]
  },
  {
    id: "contracts-2024",
    title: "Employment Contracts - 2024/2025 Updates",
    category: "Employment",
    content: `Employment contract requirements (2024/2025 updates):

Contract types (post-2022 reform):
- Only LIMITED contracts allowed (fixed-term)
- Term: 1-3 years, renewable
- Unlimited contracts: Must be converted by Feb 2023 (grace period ended)

Mandatory contract elements:
- Employer and employee details
- Job title and description
- Place of work
- Contract start date and duration
- Probation period (if any)
- Working hours
- Wages and payment method
- Leave entitlements
- Notice period
- Termination conditions

Language requirements:
- Contract must be in Arabic (for legal purposes)
- Translation in another language permitted alongside Arabic
- Arabic version prevails in disputes`,
    reference: "Federal Decree-Law No. 33/2021, Articles 8-12",
    keywords: ["contract", "limited", "fixed-term", "mandatory", "Arabic", "2024", "renewal"]
  }
];

function searchLawSections(query: string, maxResults: number = 5): LawSection[] {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  const scored = UAE_LABOR_LAW_KNOWLEDGE_BASE.map(section => {
    let score = 0;
    
    const titleLower = section.title.toLowerCase();
    const contentLower = section.content.toLowerCase();
    const categoryLower = section.category.toLowerCase();
    
    for (const word of queryWords) {
      if (titleLower.includes(word)) score += 5;
      if (section.keywords.some(k => k.includes(word))) score += 3;
      if (categoryLower.includes(word)) score += 2;
      if (contentLower.includes(word)) score += 1;
    }
    
    if (titleLower.includes(queryLower)) score += 10;
    if (contentLower.includes(queryLower)) score += 5;
    
    return { section, score };
  });
  
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(s => s.section);
}

export class UAELaborLawSearchTool extends Tool {
  name = "search_uae_labor_law";
  description = `Search UAE Labour Law (Federal Decree-Law No. 33/2021) for specific provisions.
Input should be a JSON object with:
- query: search terms (required) - e.g., "gratuity calculation", "annual leave", "termination notice"
- maxResults: maximum results to return (optional, default: 3)
Example: {"query": "end of service gratuity calculation", "maxResults": 3}`;

  async _call(input: string): Promise<string> {
    try {
      const parsed = JSON.parse(input);
      const { query, maxResults = 3 } = parsed;

      if (!query) {
        return JSON.stringify({ success: false, error: "Query is required" });
      }

      const results = searchLawSections(query, maxResults);

      if (results.length === 0) {
        return JSON.stringify({
          success: true,
          message: "No matching provisions found. Try different search terms.",
          results: [],
          suggestions: ["gratuity", "leave", "termination", "working hours", "emirates", "contract"]
        });
      }

      return JSON.stringify({
        success: true,
        query,
        results: results.map(r => ({
          title: r.title,
          category: r.category,
          content: r.content,
          reference: r.reference
        }))
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message || "Failed to search labor law"
      });
    }
  }
}

export class GratuityCalculatorTool extends Tool {
  name = "calculate_gratuity";
  description = `Calculate end-of-service gratuity according to UAE Labour Law.
Input should be a JSON object with:
- basicSalary: monthly basic salary in AED (required)
- yearsOfService: total years of service (required)
- monthsOfService: additional months beyond complete years (optional, default: 0)
- isResignation: whether employee resigned (optional, default: false)
- isLimitedContract: whether contract is limited/fixed-term (optional, default: true)
Example: {"basicSalary": 10000, "yearsOfService": 7, "monthsOfService": 6, "isResignation": false, "isLimitedContract": true}`;

  async _call(input: string): Promise<string> {
    try {
      const parsed = JSON.parse(input);
      const { 
        basicSalary, 
        yearsOfService, 
        monthsOfService = 0,
        isResignation = false,
        isLimitedContract = true
      } = parsed;

      if (!basicSalary || yearsOfService === undefined) {
        return JSON.stringify({ 
          success: false, 
          error: "basicSalary and yearsOfService are required" 
        });
      }

      const totalYears = yearsOfService + (monthsOfService / 12);

      if (totalYears < 1) {
        return JSON.stringify({
          success: true,
          gratuity: 0,
          message: "No gratuity entitlement - minimum 1 year of service required",
          calculation: {
            basicSalary,
            totalYears: totalYears.toFixed(2),
            entitled: false
          }
        });
      }

      const dailyWage = basicSalary / 30;
      
      let gratuity = 0;
      
      if (totalYears <= 5) {
        gratuity = dailyWage * 21 * totalYears;
      } else {
        const first5Years = dailyWage * 21 * 5;
        const remainingYears = dailyWage * 30 * (totalYears - 5);
        gratuity = first5Years + remainingYears;
      }

      const maxGratuity = basicSalary * 24;
      if (gratuity > maxGratuity) {
        gratuity = maxGratuity;
      }

      let reductionPercentage = 0;
      let finalGratuity = gratuity;
      let reductionReason = "No reduction applied";

      if (isResignation && !isLimitedContract) {
        if (totalYears < 3) {
          reductionPercentage = 66.67;
          finalGratuity = gratuity / 3;
          reductionReason = "1-3 years service: entitled to 1/3 of gratuity";
        } else if (totalYears < 5) {
          reductionPercentage = 33.33;
          finalGratuity = (gratuity * 2) / 3;
          reductionReason = "3-5 years service: entitled to 2/3 of gratuity";
        } else {
          reductionReason = "5+ years service: entitled to full gratuity";
        }
      } else if (isLimitedContract) {
        reductionReason = "Limited contract: Full gratuity regardless of who terminates";
      }

      return JSON.stringify({
        success: true,
        gratuity: Math.round(finalGratuity),
        message: `Gratuity calculated: AED ${Math.round(finalGratuity).toLocaleString()}`,
        calculation: {
          basicSalary,
          dailyWage: dailyWage.toFixed(2),
          totalYears: totalYears.toFixed(2),
          calculatedGratuity: Math.round(gratuity),
          maxGratuity,
          reductionPercentage,
          reductionReason,
          finalGratuity: Math.round(finalGratuity),
          contractType: isLimitedContract ? "Limited (Fixed-Term)" : "Unlimited",
          terminationType: isResignation ? "Resignation" : "Termination by employer"
        },
        reference: "Federal Decree-Law No. 33/2021, Articles 51-53"
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message || "Failed to calculate gratuity"
      });
    }
  }
}

export class EmitisationCheckTool extends Tool {
  name = "check_emiratisation";
  description = `Check Emiratisation compliance and calculate penalties.
Input should be a JSON object with:
- totalSkilledEmployees: number of skilled workers in company (required)
- currentEmiratiCount: number of Emirati employees (required)
- year: year for calculation (optional, default: 2024)
Example: {"totalSkilledEmployees": 100, "currentEmiratiCount": 5, "year": 2024}`;

  async _call(input: string): Promise<string> {
    try {
      const parsed = JSON.parse(input);
      const { totalSkilledEmployees, currentEmiratiCount, year = 2024 } = parsed;

      if (totalSkilledEmployees === undefined || currentEmiratiCount === undefined) {
        return JSON.stringify({ 
          success: false, 
          error: "totalSkilledEmployees and currentEmiratiCount are required" 
        });
      }

      if (totalSkilledEmployees < 50) {
        return JSON.stringify({
          success: true,
          message: "Companies with fewer than 50 skilled employees are not subject to Emiratisation quotas",
          compliance: {
            exempt: true,
            reason: "Company has fewer than 50 skilled employees"
          }
        });
      }

      const targetPercentages: { [key: number]: number } = {
        2024: 6,
        2025: 8,
        2026: 10
      };

      const penaltyPerMissing: { [key: number]: number } = {
        2024: 84000,
        2025: 96000,
        2026: 108000
      };

      const targetPercent = targetPercentages[year] || targetPercentages[2024];
      const requiredEmiratis = Math.ceil(totalSkilledEmployees * (targetPercent / 100));
      const shortage = Math.max(0, requiredEmiratis - currentEmiratiCount);
      const currentPercent = (currentEmiratiCount / totalSkilledEmployees) * 100;
      const annualPenalty = shortage * (penaltyPerMissing[year] || penaltyPerMissing[2024]);
      const monthlyPenalty = annualPenalty / 12;

      return JSON.stringify({
        success: true,
        message: shortage === 0 
          ? "Company is compliant with Emiratisation requirements"
          : `Company needs ${shortage} more Emirati employee(s) to comply`,
        compliance: {
          compliant: shortage === 0,
          year,
          totalSkilledEmployees,
          currentEmiratiCount,
          currentPercentage: currentPercent.toFixed(2),
          targetPercentage: targetPercent,
          requiredEmiratis,
          shortage,
          annualPenalty: shortage > 0 ? `AED ${annualPenalty.toLocaleString()}` : "None",
          monthlyPenalty: shortage > 0 ? `AED ${Math.round(monthlyPenalty).toLocaleString()}` : "None",
          penaltyNote: "Penalties are per missing Emirati employee, calculated annually"
        },
        reference: "Cabinet Resolution No. 18/2022, Ministerial Resolution 279/2022"
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message || "Failed to check Emiratisation compliance"
      });
    }
  }
}
