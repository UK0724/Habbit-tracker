import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { DsaProblemModel } from "./modules/dsaPrep/dsaPrep.model.js";
import { dsaProblems } from "./modules/dsaPrep/dsaProblemsData.js";

// Repeatable catalog updates never delete user data or progress.
const seed = async () => {
  await connectDatabase();
  try {
    for (const problem of dsaProblems) {
      await DsaProblemModel.updateOne({ id: problem.id }, { $set: problem }, { upsert: true, runValidators: true });
    }
    console.log("Catalog updated. User data was preserved.");
  } finally {
    await disconnectDatabase();
  }
};
void seed().catch((error: unknown) => { console.error("Catalog update failed", error); process.exitCode = 1; });
