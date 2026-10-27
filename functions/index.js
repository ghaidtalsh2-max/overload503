const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

// Server-side authoritative scoring points map
const DECISION_POINTS = {
  'dec-detect-web': { 'opt-w1-a': 70, 'opt-w1-b': 20, 'opt-w1-c': 0 },
  'dec-detect-ai': { 'opt-a1-a': 70, 'opt-a1-b': 15 },
  'dec-detect-data': { 'opt-d1-a': 70, 'opt-d1-b': 10 },
  'dec-inv-web': { 'opt-w2-a': 80, 'opt-w2-b': 20 },
  'dec-cont-web': { 'opt-w3-a': 100, 'opt-w3-b': 10 },
  'dec-cont-data': { 'opt-d3-a': 90, 'opt-d3-b': 0 },
  'dec-rec-web': { 'opt-w4-a': 80, 'opt-w4-b': 15 },
  'dec-post-all': { 'opt-p5-a': 70, 'opt-p5-b': 10 }
};

const EVIDENCE_POINTS = {
  'ev-1': 50,
  'ev-2': 100,
  'ev-3': 75,
  'ev-4': 75,
  'ev-5': 75,
  'ev-6': 50
};

/**
 * Authoritative Server-Side Scoring Function
 * Ensures client browsers cannot manipulate their final score or badges
 */
exports.authoritativeScoring = onDocumentWritten(
  'sessions/{sessionId}/participants/{participantId}',
  async (event) => {
    const afterData = event.data.after.data();
    if (!afterData) return; // Deleted

    const decisionsMade = afterData.decisionsMade || {};
    const evidenceInspected = afterData.evidenceInspected || [];
    const notes = afterData.incidentNotes || '';

    // Calculate server authoritative score
    let evidenceAnalysis = 0;
    for (const evId of evidenceInspected) {
      if (EVIDENCE_POINTS[evId]) {
        evidenceAnalysis += EVIDENCE_POINTS[evId];
      }
    }
    evidenceAnalysis = Math.min(300, evidenceAnalysis);

    let defensiveDecisions = 0;
    let recoveryVerification = 0;
    let incidentReport = 0;
    let correctCount = 0;
    let totalCount = 0;

    for (const [decId, optId] of Object.entries(decisionsMade)) {
      const pts = DECISION_POINTS[decId]?.[optId] || 0;
      totalCount++;
      if (pts >= 70) correctCount++;

      if (decId === 'dec-rec-web') {
        recoveryVerification += pts;
      } else if (decId === 'dec-post-all') {
        incidentReport += Math.round(pts * 0.7);
      } else {
        defensiveDecisions += pts;
      }
    }

    defensiveDecisions = Math.min(350, defensiveDecisions);
    recoveryVerification = Math.min(200, recoveryVerification);

    if (notes.trim().length > 20) {
      incidentReport = Math.min(100, incidentReport + Math.min(30, Math.floor(notes.trim().length / 5)));
    }

    let responseEfficiency = 0;
    if (totalCount > 0) {
      responseEfficiency = Math.round((correctCount / totalCount) * 50);
    }

    const authoritativeTotal = Math.min(
      1000,
      evidenceAnalysis + defensiveDecisions + recoveryVerification + incidentReport + responseEfficiency
    );

    // Compute badges server-side
    const badges = [];
    if (authoritativeTotal >= 850) badges.push('badge-overload-survivor');
    if (evidenceInspected.length >= 5) badges.push('badge-forensic-master');
    if (decisionsMade['dec-cont-web'] === 'opt-w3-a') badges.push('badge-zero-breach');
    if (decisionsMade['dec-rec-web'] === 'opt-w4-a') badges.push('badge-golden-patch');
    if (correctCount >= 4) badges.push('badge-rapid-responder');

    // Only update if score/badges diverged from client representation
    if (
      afterData.totalScore !== authoritativeTotal ||
      JSON.stringify(afterData.badges || []) !== JSON.stringify(badges)
    ) {
      return event.data.after.ref.update({
        totalScore: authoritativeTotal,
        scoreBreakdown: {
          evidenceAnalysis,
          defensiveDecisions,
          recoveryVerification,
          incidentReport,
          responseEfficiency
        },
        badges,
        serverVerifiedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }
);
