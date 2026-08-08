export class AssessmentManager {
  constructor({ storage, events }) {
    this.storage = storage;
    this.events = events;
  }

  submit(activity, answers = []) {
    const questions = activity.quiz || [];
    let correct = 0;

    questions.forEach((q, index) => {
      if (Number(answers[index]) === Number(q.answer)) correct += 1;
    });

    const total = questions.length;
    const percent = total ? Math.round((correct / total) * 100) : 0;

    const attempt = {
      activityId: activity.id,
      code: activity.code,
      correct,
      total,
      percent,
      createdAt: new Date().toISOString()
    };

    const key = `assessment:${activity.id}`;
    const attempts = this.storage.get(key, []);
    attempts.push(attempt);
    this.storage.set(key, attempts.slice(-10));

    this.events.emit("assessment:submitted", attempt);
    return attempt;
  }

  getAttempts(activityId) {
    return this.storage.get(`assessment:${activityId}`, []);
  }

  getBest(activityId) {
    const attempts = this.getAttempts(activityId);
    return attempts.reduce((best, item) => !best || item.percent > best.percent ? item : best, null);
  }

  reset(activityId) {
    this.storage.remove(`assessment:${activityId}`);
    this.events.emit("assessment:reset", { activityId });
  }
}
