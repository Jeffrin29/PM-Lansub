'use strict';

const HrEmployee = require('../models/HrEmployee');

/**
 * generateEmployeeId
 * ------------------
 * Generates the next sequential employee ID for an organization in EMP001 format.
 *
 * Uses an aggregation pipeline to parse the numeric suffix and sort NUMERICALLY,
 * which avoids the string-sort trap where "EMP999" > "EMP1000".
 *
 * @param {mongoose.Types.ObjectId|string} organizationId
 * @returns {Promise<string>}  e.g. "EMP001", "EMP042", "EMP1000"
 */
const generateEmployeeId = async (organizationId) => {
  const result = await HrEmployee.aggregate([
    {
      $match: {
        organizationId: typeof organizationId === 'string'
          ? require('mongoose').Types.ObjectId(organizationId)
          : organizationId,
        employeeId: { $regex: /^EMP\d+$/ },
      },
    },
    {
      // Extract the numeric part as an integer for correct numeric ordering
      $addFields: {
        numericPart: {
          $toInt: { $substr: ['$employeeId', 3, -1] },
        },
      },
    },
    { $sort: { numericPart: -1 } },
    { $limit: 1 },
    { $project: { numericPart: 1, _id: 0 } },
  ]);

  const nextNum = result.length > 0 ? result[0].numericPart + 1 : 1;

  // Pad to 3 digits minimum; larger numbers print as-is (EMP1000, EMP1001, …)
  return `EMP${String(nextNum).padStart(3, '0')}`;
};

module.exports = { generateEmployeeId };
