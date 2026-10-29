// Simple role helpers
exports.isAdmin = (u) => u?.role === 'admin';
exports.isEvaluator = (u) => u?.role === 'evaluator';
exports.isEvaluatee = (u) => u?.role === 'evaluatee';
