import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Recycle, Bus, Lock, Award, Coins, CheckCircle2, ShieldCheck,
  HelpCircle, Info, ArrowRight, ChevronDown, FileText, Building2,
  TrendingUp, Sparkles, AlertTriangle, Calendar, Layers, Shield
} from 'lucide-react';
import './GreenRewardsPage.css';

const earningRules = [
  {
    activity: "Genuine QR disposal at authorized municipal bin",
    points: "+100 Pts",
    description: "Credited when QR scan and disposal event pass verification checks",
    icon: CheckCircle2,
  },
  {
    activity: "Authenticated complaint submission",
    points: "+150 Pts",
    description: "Complaint earns points only after AI/ops verification and valid workflow status",
    icon: Recycle,
  },
  {
    activity: "2-week consistency streak",
    points: "+200 Pts",
    description: "Awarded for every 14-day consecutive verified disposal streak",
    icon: Calendar,
  },
  {
    activity: "1-month consistency streak",
    points: "+500 Pts",
    description: "Additional bonus for every 30-day verified streak",
    icon: Award,
  },
];

const benefits = [
  {
    service: "Public Bus / Monthly Pass",
    frequency: "As per billing cycle",
    usage: "Direct Redemption",
    benefit: "Transport Tax rebate via direct points redemption",
    icon: Bus,
    color: '#2563eb',
  },
  {
    service: "Eco Bazaar Discount Coupon",
    frequency: "Anytime",
    usage: "Direct Redemption",
    benefit: "Redeem points into coupon codes for eco-friendly partner stores",
    icon: Recycle,
    color: '#f59e0b',
  },
  {
    service: "Water Tax Rebate",
    frequency: "Annual",
    usage: "Points Must Be Locked",
    benefit: "Annual municipal water tax rebate",
    icon: FileText,
    color: '#06b6d4',
  },
  {
    service: "Property Tax Concession",
    frequency: "Annual",
    usage: "Points Must Be Locked",
    benefit: "Annual municipal property tax rebate voucher",
    icon: Building2,
    color: '#16a34a',
  },
];

const tiers = [
  {
    points: "0 – 99",
    category: "Basic Citizen",
    tier: "Standard",
    benefit: "Standard monthly redemption eligibility",
  },
  {
    points: "100 – 199",
    category: "Green Citizen",
    tier: "Tier I",
    benefit: "5% bonus rebate matching on tax lock",
  },
  {
    points: "200 – 249",
    category: "Responsible Citizen",
    tier: "Tier II",
    benefit: "10% bonus rebate matching + Priority bus pass",
  },
  {
    points: "250 – 300",
    category: "Model Green Citizen",
    tier: "Tier III",
    benefit: "Maximum 15% tax rebate + Full pool privilege",
  },
];

const faqs = [
  {
    question: "Are my points automatically divided between benefits?",
    answer:
      "No. All verified Green Points are first credited to your Available Green Points balance. You decide how and when they are used.",
  },
  {
    question: "Can I use all my points for a bus pass?",
    answer:
      "Yes, subject to the applicable monthly redemption ceiling and availability under the Green Reward Pool.",
  },
  {
    question: "Can I save all my points for property tax?",
    answer:
      "Yes. You may voluntarily lock eligible Available Green Points for annual property-tax use.",
  },
  {
    question: "Can locked tax points be withdrawn again?",
    answer:
      "Yes. You can release points from the annual tax wallet back to available balance whenever needed and re-lock them later.",
  },
  {
    question: "What happens to points I do not use?",
    answer:
      "Available Green Points that are neither redeemed nor locked expire after two months from their date of credit.",
  },
  {
    question: "Do tax-locked points expire after two months?",
    answer:
      "No. Valid points locked before expiry are reserved for the applicable annual municipal tax benefit and are removed from the normal two-month expiry cycle.",
  },
  {
    question: "Can citizens with equal scores receive equal benefits?",
    answer:
      "Yes. CivicSync follows an eligibility-based approach. Citizens with the same verified score are governed by the same eligibility rules and prescribed limits.",
  },
  {
    question: "Does the municipality simply lose money by providing rewards?",
    answer:
      "The proposed scheme links benefits to a policy-defined Green Reward Pool supported by verified operational savings generated through improved waste collection, routing and fleet utilization.",
  },
];

export default function GreenRewardsPage() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="gr-page-layout">
      {/* Native Page Header matching Citizen Dashboard design */}
      <div className="container">
        <div className="gr-page-header">
          <div className="gr-header-badge">
            <ShieldCheck size={14} /> Official Policy &amp; Redemption Guidelines
          </div>
          <h1 className="gr-page-title">
            Your Green Points. <span className="gr-title-highlight">Your Choice of Benefit.</span>
          </h1>
          <p className="gr-page-subtitle">
            Every verified Civic Green Point is credited to your available balance. You may use your points for eligible monthly services or voluntarily lock them for annual municipal tax benefits.
          </p>
          
          <div className="gr-header-actions">
            <a href="#allocation" className="btn btn-primary">
              How Point Allocation Works <ArrowRight size={16} />
            </a>
            <a href="#services" className="btn btn-outline">
              View Eligible Services
            </a>
            <Link to="/my-carbon-card" className="btn btn-secondary">
              <Award size={16} /> My Carbon Card
            </Link>
          </div>
        </div>

        <div className="gr-content-stack">
          {/* ================= SECTION 01: WHAT ARE POINTS ================= */}
          <section className="gr-section">
            <SectionHeader
              number="01"
              title="What Are Civic Green Points?"
              description="Non-cash civic benefit points issued for verified responsible waste practices."
            />
            <div className="card gr-card gr-border-left-green">
              <p className="gr-lead-text">
                Civic Green Points are credited to registered citizens for verified participation in responsible waste collection, segregation, and scheduled waste handover through CivicSync.
              </p>
              <p className="gr-body-text">
                All points initially remain in one <strong>Available Green Points Balance</strong>. CivicSync does not automatically divide or assign your points to any specific benefit.
              </p>
              <div className="gr-info-callout">
                <div className="gr-callout-header">
                  <Info size={18} className="gr-callout-icon" />
                  <strong>IMPORTANT POLICY RULE</strong>
                </div>
                <p>
                  Green Points are non-cash benefit credits and may only be redeemed against eligible services under approved scheme conditions.
                </p>
              </div>
            </div>
          </section>

          {/* ================= SECTION 02: EARNING RULES ================= */}
          <section className="gr-section">
            <SectionHeader
              number="02"
              title="How Are Points Earned?"
              description="Points are credited only after verified civic participation."
            />
            <div className="gr-grid gr-grid-2">
              {earningRules.map((rule) => {
                const IconComp = rule.icon;
                return (
                  <div key={rule.activity} className="card gr-card gr-rule-card">
                    <div className="gr-rule-top">
                      <div className="gr-icon-badge">
                        <IconComp size={20} />
                      </div>
                      <span className="badge badge-success font-bold">{rule.points}</span>
                    </div>
                    <h3 className="gr-card-title">{rule.activity}</h3>
                    <p className="gr-card-sub">{rule.description}</p>
                  </div>
                );
              })}
            </div>
            <div className="gr-warning-callout">
              <AlertTriangle size={18} className="gr-warning-icon" />
              <div>
                <strong>Verification Rule:</strong> QR scanning alone does not generate Green Points. The waste handover and applicable segregation requirements must first be verified on-site by the collection driver.
              </div>
            </div>
          </section>

          {/* ================= SECTION 03: USER CHOICE & ALLOCATION DEMO ================= */}
          <section className="gr-section" id="allocation">
            <SectionHeader
              number="03"
              title="You Decide How Your Points Are Used"
              description="There is no compulsory or automatic percentage allocation."
            />

            <div className="card gr-card">
              <div className="gr-balance-widget">
                <span className="gr-widget-label">AVAILABLE GREEN POINTS BALANCE</span>
                <div className="gr-widget-points">300 Points</div>
                <span className="gr-widget-sub">Illustrative Citizen Account Balance</span>
              </div>

              <div className="gr-grid gr-grid-3" style={{ marginTop: 24 }}>
                <ChoiceCard
                  icon={Bus}
                  title="Use for Public Transport"
                  text="Redeem eligible points against bus travel or monthly public transport passes."
                  color="#2563eb"
                />
                <ChoiceCard
                  icon={Sparkles}
                  title="Use for Eco Bazaar Discounts"
                  text="Redeem eligible points for partner-store coupon codes and eco bazaar offers."
                  color="#f59e0b"
                />
                <ChoiceCard
                  icon={Lock}
                  title="Lock for Municipal Taxes"
                  text="Voluntarily reserve selected points for annual water tax or property tax benefits."
                  color="#16a34a"
                />
              </div>
            </div>

            <div className="card gr-card gr-example-box" style={{ marginTop: 16 }}>
              <h4 className="gr-example-header"><Sparkles size={16} /> Practical Allocation Example</h4>
              <p className="gr-body-text">
                A citizen with <strong>300 available points</strong> may choose to use 100 points for public transport, 50 points for an eco bazaar coupon, and lock the remaining 150 points for annual property tax.
              </p>
              <p className="gr-body-sub">
                The allocation is determined by the citizen and is not automatically decided by CivicSync.
              </p>
            </div>

            {/* Interactive Allocation Calculator */}
            <AllocationCalculator />
          </section>

          {/* ================= SECTION 04: ELIGIBLE SERVICES ================= */}
          <section className="gr-section" id="services">
            <SectionHeader
              number="04"
              title="Eligible Services & Benefits"
              description="Citizens may decide which approved benefit should receive their available Green Points."
            />

            <div className="gr-grid gr-grid-2">
              {benefits.map((b) => {
                const IconComp = b.icon;
                return (
                  <div key={b.service} className="card gr-card gr-service-card" style={{ '--accent-color': b.color }}>
                    <div className="gr-service-header">
                      <div className="gr-service-icon-box" style={{ background: `${b.color}15`, color: b.color }}>
                        <IconComp size={22} />
                      </div>
                      <div>
                        <h3 className="gr-card-title">{b.service}</h3>
                        <span className="badge badge-neutral">{b.frequency} Redemption</span>
                      </div>
                    </div>
                    <div className="gr-service-rows">
                      <div className="gr-service-row">
                        <span>Point Treatment:</span>
                        <strong>{b.usage}</strong>
                      </div>
                      <div className="gr-service-row">
                        <span>Benefit Support:</span>
                        <strong>{b.benefit}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ================= SECTION 05: POINT VALIDITY & TAX LOCKING ================= */}
          <section className="gr-section">
            <SectionHeader
              number="05"
              title="Point Validity & Tax Locking"
              description="Citizens must use or lock their available points within the prescribed validity period."
            />

            <div className="gr-grid gr-grid-3">
              <PolicyCard
                icon={Calendar}
                heading="Available Points"
                value="2 Months"
                text="Unused available points expire two months after being credited."
                color="#2563eb"
              />
              <PolicyCard
                icon={Coins}
                heading="Tax Reservation"
                value="Citizen Choice"
                text="Any eligible amount may be voluntarily locked for property tax or water tax."
                color="#f59e0b"
              />
              <PolicyCard
                icon={Lock}
                heading="Locked Points"
                value="Protected"
                text="Once valid points are locked for tax use, they leave the normal two-month expiry cycle."
                color="#16a34a"
              />
            </div>

            <div className="gr-warning-callout" style={{ marginTop: 16 }}>
              <Lock size={18} className="gr-warning-icon" />
              <div>
                <strong>Locking is irreversible for the selected annual billing cycle.</strong> Once a citizen confirms that specific Green Points are reserved for water tax or property tax, those points cannot subsequently be transferred back to public transport or electricity benefits.
              </div>
            </div>
          </section>

          {/* ================= SECTION 06: COMPLETE LIFECYCLE ================= */}
          <section className="gr-section">
            <SectionHeader
              number="06"
              title="Complete Green Point Lifecycle"
              description="From verified waste participation to citizen-selected benefit."
            />

            <div className="card gr-card">
              <div className="gr-pipeline-container">
                {[
                  { step: "1", title: "Verified Activity", desc: "Handover & segregation" },
                  { step: "2", title: "Points Credited", desc: "Added to account" },
                  { step: "3", title: "Available Balance", desc: "Central Green Pool" },
                  { step: "4", title: "Citizen Selects", desc: "Pick preferred benefit" },
                  { step: "5", title: "Redeem or Lock", desc: "Monthly or Annual Tax" },
                  { step: "6", title: "Benefit Applied", desc: "Rebate voucher issued" },
                ].map((item, idx, arr) => (
                  <React.Fragment key={item.step}>
                    <div className="gr-pipeline-step">
                      <div className="gr-step-badge">{item.step}</div>
                      <div className="gr-step-title">{item.title}</div>
                      <div className="gr-step-desc">{item.desc}</div>
                    </div>
                    {idx < arr.length - 1 && <div className="gr-pipeline-arrow">➔</div>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </section>

          {/* ================= SECTION 07: GREEN REWARD POOL ================= */}
          <section className="gr-section">
            <SectionHeader
              number="07"
              title="How Is the Green Reward Pool Funded?"
              description="Citizen incentives are linked to verified municipal operational savings."
            />

            <div className="card gr-card">
              <p className="gr-lead-text">
                CivicSync is designed so that citizen rewards do not operate as an unrestricted reduction in municipal revenue. A policy-defined portion of verified operational savings generated through waste collection optimization may be transferred into a controlled Green Reward Pool.
              </p>

              <div className="gr-pipeline-container" style={{ marginTop: 24 }}>
                {[
                  "Better Routes",
                  "Reduced Distance",
                  "Lower Fuel Cost",
                  "Verified Savings",
                  "Reward Pool",
                  "Citizen Benefits",
                ].map((step, idx, arr) => (
                  <React.Fragment key={step}>
                    <div className="gr-pipeline-box">
                      <span>{step}</span>
                    </div>
                    {idx < arr.length - 1 && <div className="gr-pipeline-arrow">➔</div>}
                  </React.Fragment>
                ))}
              </div>

              <div className="gr-formula-banner">
                <span className="gr-formula-tag">PROPOSED MUNICIPAL FUNDING FORMULA</span>
                <div className="gr-formula-calc">
                  Verified Municipal Savings × Approved Allocation Share = Green Reward Pool
                </div>
              </div>
            </div>
          </section>

          {/* ================= SECTION 08: POOL CALCULATION TABLE ================= */}
          <section className="gr-section">
            <SectionHeader
              number="08"
              title="Illustrative Pool Calculation"
              description="An example demonstrating how the municipality remains financially better off while supporting citizen rewards."
            />

            <div className="card gr-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="gr-table-header-banner">
                Illustration Only — Not an Approved Municipal Budget
              </div>
              <div className="table-responsive">
                <table className="gr-table">
                  <tbody>
                    <CalcTableRow
                      title="Annual waste collection expenditure before CivicSync"
                      amount="Rs. 1,00,00,000"
                    />
                    <CalcTableRow
                      title="Annual expenditure after optimization"
                      amount="Rs. 90,00,000"
                    />
                    <CalcTableRow
                      title="Verified operational savings"
                      amount="Rs. 10,00,000"
                      bold
                    />
                    <CalcTableRow
                      title="Illustrative reward allocation share"
                      amount="20%"
                    />
                    <CalcTableRow
                      title="Green Reward Pool for Citizen Benefits"
                      amount="Rs. 2,00,000"
                      accent
                    />
                    <CalcTableRow
                      title="Net savings retained by municipality"
                      amount="Rs. 8,00,000"
                      green
                    />
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ================= SECTION 09: REDEMPTION EXAMPLES ================= */}
          <section className="gr-section">
            <SectionHeader
              number="09"
              title="How a Citizen May Use Green Points"
              description="Illustrative examples of citizen-selected redemption."
            />

            <div className="gr-grid gr-grid-3">
              <BenefitExampleCard
                icon={Bus}
                title="Transport Tax Rebate"
                original="Rs. 800"
                support="Rs. 50"
                payable="Rs. 750"
                frequency="Monthly"
                color="#2563eb"
              />
              <BenefitExampleCard
                icon={Sparkles}
                title="Eco Bazaar Coupon"
                original="Rs. 1,200"
                support="Rs. 75"
                payable="Rs. 1,125"
                frequency="Anytime"
                color="#f59e0b"
              />
              <BenefitExampleCard
                icon={Building2}
                title="Property Tax"
                original="Rs. 8,000"
                support="Rs. 300"
                payable="Rs. 7,700"
                frequency="Annual"
                color="#16a34a"
              />
            </div>
          </section>

          {/* ================= SECTION 10: FAIRNESS & TIERS ================= */}
          <section className="gr-section">
            <SectionHeader
              number="10"
              title="Equal Score, Equal Eligibility"
              description="Citizens are not ranked against each other for access to benefits."
            />

            <div className="card gr-card">
              <p className="gr-body-text">
                CivicSync follows an eligibility-based model. If multiple citizens maintain the same verified Green Points score, they are placed under the same applicable eligibility category. Individual benefit utilization may differ because each citizen decides how available points are redeemed or locked.
              </p>

              <div className="table-responsive" style={{ marginTop: 20 }}>
                <table className="gr-table">
                  <thead>
                    <tr>
                      <th>Monthly Score</th>
                      <th>Citizen Category</th>
                      <th>Tier Eligibility</th>
                      <th>Special Privilege</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiers.map((t) => (
                      <tr key={t.points}>
                        <td className="gr-td-bold">{t.points} Pts</td>
                        <td>{t.category}</td>
                        <td>
                          <span className="badge badge-success">{t.tier}</span>
                        </td>
                        <td className="gr-td-sub">{t.benefit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ================= SECTION 11: FAQ ACCORDION ================= */}
          <section className="gr-section">
            <SectionHeader
              number="11"
              title="Frequently Asked Questions"
              description="Important rules regarding Green Point utilization."
            />

            <div className="card gr-card" style={{ padding: 0, overflow: 'hidden' }}>
              {faqs.map((faq, idx) => (
                <div key={faq.question} className={`gr-faq-item ${openFaq === idx ? 'open' : ''}`}>
                  <button className="gr-faq-btn" onClick={() => toggleFaq(idx)}>
                    <HelpCircle size={18} className="gr-faq-icon" />
                    <span>{faq.question}</span>
                    <ChevronDown size={16} className={`gr-faq-chevron ${openFaq === idx ? 'rotate' : ''}`} />
                  </button>
                  {openFaq === idx && (
                    <div className="gr-faq-body">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ================= SECTION 12: DISCLAIMER ================= */}
          <section className="gr-section">
            <div className="card gr-card gr-disclaimer-box">
              <div className="gr-disclaimer-top">
                <Info size={18} />
                <span>OFFICIAL MUNICIPAL SCHEME DISCLAIMER</span>
              </div>
              <p>
                Civic Green Points and associated citizen benefits remain subject to municipal approval, departmental coordination, verification, fiscal limits, Green Reward Pool availability, and final implementation guidelines issued by the competent authority. Monetary examples shown are illustrative.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================
   SUPPORT COMPONENTS
========================================================== */

function SectionHeader({ number, title, description }) {
  return (
    <div className="gr-section-header">
      <div className="gr-section-num">{number}</div>
      <div>
        <h2 className="gr-section-title">{title}</h2>
        <p className="gr-section-desc">{description}</p>
      </div>
    </div>
  );
}

function ChoiceCard({ icon: Icon, title, text, color }) {
  return (
    <div className="card gr-card gr-choice-card" style={{ '--accent-color': color }}>
      <div className="gr-choice-icon-box" style={{ background: `${color}15`, color }}>
        <Icon size={24} />
      </div>
      <h3 className="gr-card-title">{title}</h3>
      <p className="gr-card-sub">{text}</p>
    </div>
  );
}

function PolicyCard({ icon: Icon, heading, value, text, color }) {
  return (
    <div className="card gr-card gr-policy-card" style={{ borderTop: `3px solid ${color}` }}>
      <span className="gr-policy-tag">{heading}</span>
      <div className="gr-policy-val" style={{ color }}>{value}</div>
      <p className="gr-card-sub">{text}</p>
    </div>
  );
}

function BenefitExampleCard({ icon: Icon, title, original, support, payable, frequency, color }) {
  return (
    <div className="card gr-card gr-bcard" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="gr-bcard-header">
        <div className="gr-bcard-title">
          <Icon size={18} style={{ color }} />
          <span>{title}</span>
        </div>
        <span className="badge badge-neutral">{frequency}</span>
      </div>
      <div className="gr-bcard-body">
        <div className="gr-bcard-row">
          <span>Original Amount</span>
          <strong>{original}</strong>
        </div>
        <div className="gr-bcard-row gr-bcard-discount">
          <span>Green Reward Support</span>
          <strong>− {support}</strong>
        </div>
        <div className="gr-bcard-divider" />
        <div className="gr-bcard-row gr-bcard-final">
          <span>Citizen Payable</span>
          <strong>{payable}</strong>
        </div>
      </div>
    </div>
  );
}

function CalcTableRow({ title, amount, bold = false, accent = false, green = false }) {
  return (
    <tr className={accent ? 'gr-tr-accent' : green ? 'gr-tr-green' : ''}>
      <td className={bold || accent || green ? 'gr-td-bold' : ''}>{title}</td>
      <td className={`gr-td-amount ${accent ? 'gr-txt-accent' : green ? 'gr-txt-green' : ''}`}>
        {amount}
      </td>
    </tr>
  );
}

/* ==========================================================
   INTERACTIVE ALLOCATION CALCULATOR COMPONENT
========================================================== */
function AllocationCalculator() {
  const total = 300;
  const [transport, setTransport] = useState(100);
  const [electricity, setElectricity] = useState(50);
  const [waterTax, setWaterTax] = useState(0);
  const [propertyTax, setPropertyTax] = useState(150);

  const used = transport + electricity + waterTax + propertyTax;
  const remaining = total - used;

  return (
    <div className="card gr-card gr-calc-card" style={{ marginTop: 24 }}>
      <div className="gr-calc-header">
        <h3 className="gr-calc-title"><Coins size={20} style={{ color: '#7c3aed' }} /> Interactive Point Allocation Simulator</h3>
        <p className="gr-card-sub">
          Adjust the values below to understand how a citizen may allocate their available points.
        </p>
      </div>

      <div className="gr-calc-bar">
        <div>
          <span className="gr-cstat-label">AVAILABLE BALANCE</span>
          <div className="gr-cstat-val">{total} Pts</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span className="gr-cstat-label">UNALLOCATED BALANCE</span>
          <div className={`gr-cstat-val ${remaining >= 0 ? 'gr-txt-green' : 'gr-txt-danger'}`}>
            {remaining} Pts
          </div>
        </div>
      </div>

      <div className="gr-grid gr-grid-2" style={{ marginTop: 16 }}>
        <AllocationField
          label="Public Transport"
          icon={Bus}
          value={transport}
          onChange={(v) => setTransport(Math.max(0, v))}
        />
        <AllocationField
          label="Eco Bazaar Coupon"
          icon={Sparkles}
          value={electricity}
          onChange={(v) => setElectricity(Math.max(0, v))}
        />
        <AllocationField
          label="Lock for Water Tax"
          icon={Lock}
          locked
          value={waterTax}
          onChange={(v) => setWaterTax(Math.max(0, v))}
        />
        <AllocationField
          label="Lock for Property Tax"
          icon={Lock}
          locked
          value={propertyTax}
          onChange={(v) => setPropertyTax(Math.max(0, v))}
        />
      </div>

      {remaining < 0 ? (
        <div className="gr-warning-callout" style={{ marginTop: 16, background: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b' }}>
          Allocated points exceed the available Green Point balance.
        </div>
      ) : (
        <div className="gr-warning-callout" style={{ marginTop: 16, background: '#f0fdf4', borderColor: '#86efac', color: '#166534' }}>
          {remaining} Green Points remain available in your account for future allocation.
        </div>
      )}
    </div>
  );
}

function AllocationField({ label, icon: Icon, value, onChange, locked = false }) {
  return (
    <div className="gr-field-box">
      <div className="gr-field-label">
        <span className="gr-field-title">
          <Icon size={16} /> {label}
        </span>
        {locked && <span className="badge badge-success" style={{ fontSize: '0.68rem' }}><Lock size={12} /> Tax Reserve</span>}
      </div>
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="form-control gr-field-input"
      />
      <span className="gr-field-hint">Green Points Allocated</span>
    </div>
  );
}
