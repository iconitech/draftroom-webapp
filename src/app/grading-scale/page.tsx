import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Grading Scale',
  description: 'NFL-Style Pro Scouting Grading Scale - Learn how we evaluate and grade draft prospects',
}

export default function GradingScalePage() {
  return (
    <div className="grading-scale-page">
      <div className="grading-scale-container">
        <h1 className="grading-scale-title">NFL-Style Pro Scouting Grading Sheet</h1>
        <p className="grading-scale-intro">
          This grading model mirrors how NFL scouts translate tape into actionable draft grades. 
          It separates traits, assigns numerical values, and anchors grades to real roster outcomes. 
          This format is publishable and defensible.
        </p>

        {/* Universal Grade Scale */}
        <section className="grading-section">
          <h2 className="section-title">Universal 1–9 Trait Grade Scale</h2>
          <div className="grade-table">
            <div className="grade-table-header">
              <div className="grade-col">Grade</div>
              <div className="meaning-col">Meaning</div>
              <div className="translation-col">NFL Translation</div>
            </div>
            <div className="grade-table-body">
              <div className="grade-row grade-9">
                <div className="grade-col">9.0</div>
                <div className="meaning-col">Rare / Elite</div>
                <div className="translation-col">Immediate All-Pro</div>
              </div>
              <div className="grade-row grade-8">
                <div className="grade-col">8.0</div>
                <div className="meaning-col">Outstanding</div>
                <div className="translation-col">Year 1 Pro Bowl caliber</div>
              </div>
              <div className="grade-row grade-7">
                <div className="grade-col">7.0</div>
                <div className="meaning-col">Very Good</div>
                <div className="translation-col">High-end starter</div>
              </div>
              <div className="grade-row grade-6-5">
                <div className="grade-col">6.5</div>
                <div className="meaning-col">Good</div>
                <div className="translation-col">Solid starter</div>
              </div>
              <div className="grade-row grade-6">
                <div className="grade-col">6.0</div>
                <div className="meaning-col">Adequate</div>
                <div className="translation-col">Average starter / high-end role player</div>
              </div>
              <div className="grade-row grade-5-5">
                <div className="grade-col">5.5</div>
                <div className="meaning-col">Marginal</div>
                <div className="translation-col">Backup / spot starter</div>
              </div>
              <div className="grade-row grade-5">
                <div className="grade-col">5.0</div>
                <div className="meaning-col">Below Average</div>
                <div className="translation-col">Roster depth</div>
              </div>
              <div className="grade-row grade-4-5">
                <div className="grade-col">4.5</div>
                <div className="meaning-col">Poor</div>
                <div className="translation-col">Camp body</div>
              </div>
              <div className="grade-row grade-4">
                <div className="grade-col">4.0</div>
                <div className="meaning-col">Replaceable</div>
                <div className="translation-col">Practice squad</div>
              </div>
            </div>
          </div>
        </section>

        {/* Position Trait Weighting */}
        <section className="grading-section">
          <h2 className="section-title">Position Trait Weighting Framework</h2>
          <p className="section-description">
            Each position is graded on core traits. Final grade is the weighted average. 
            Weights reflect real NFL priority—not college production.
          </p>
          
          <div className="positions-grid">
            <div className="position-card">
              <h3 className="position-name">QB</h3>
              <p className="position-traits">
                Processing, Accuracy, Pocket Movement, Decision-Making, Arm Talent
              </p>
            </div>

            <div className="position-card">
              <h3 className="position-name">RB</h3>
              <p className="position-traits">
                Vision, Contact Balance, Burst, Pass Protection, Ball Security
              </p>
            </div>

            <div className="position-card">
              <h3 className="position-name">WR</h3>
              <p className="position-traits">
                Separation, Route Detail, Hands, Release vs Press, YAC
              </p>
            </div>

            <div className="position-card">
              <h3 className="position-name">TE</h3>
              <p className="position-traits">
                Functional Blocking, Route IQ, Hands, Versatility
              </p>
            </div>

            <div className="position-card">
              <h3 className="position-name">OL</h3>
              <p className="position-traits">
                Footwork, Hand Usage, Balance, Anchor, Awareness
              </p>
            </div>

            <div className="position-card">
              <h3 className="position-name">DL</h3>
              <p className="position-traits">
                Get-Off, Hand Violence, Leverage, Motor
              </p>
            </div>

            <div className="position-card">
              <h3 className="position-name">EDGE</h3>
              <p className="position-traits">
                Pass Rush Plan, Burst, Power Conversion, Run Defense
              </p>
            </div>

            <div className="position-card">
              <h3 className="position-name">LB</h3>
              <p className="position-traits">
                Key Reads, First Step, Angles, Coverage Ability
              </p>
            </div>

            <div className="position-card">
              <h3 className="position-name">CB</h3>
              <p className="position-traits">
                Mirror Ability, Eyes, Ball Skills, Recovery Speed
              </p>
            </div>

            <div className="position-card">
              <h3 className="position-name">S</h3>
              <p className="position-traits">
                Processing, Range, Angles, Tackling
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
