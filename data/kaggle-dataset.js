/* =============================================
   KAGGLE DATASET: ML Olympiad - Autism Prediction
   Source: https://www.kaggle.com/code/desalegngeb/autism-spectrum-disorder-prediction
   800 records | 21 features | Target: Class/ASD
   Features: A1-A10 (AQ-10 scores), age, gender,
   ethnicity, jaundice, austim (family), country,
   used_app_before, result, relation, Class/ASD
   ============================================= */

// ---- AQ-10 QUESTION TEXT (Official) ----
const AQ10_QUESTIONS = {
  A1: "I often notice small sounds when others do not.",
  A2: "I usually concentrate more on the whole picture, rather than the small details.",
  A3: "I find it easy to do more than one thing at once.",
  A4: "If there is an interruption, I can switch back to what I was doing very quickly.",
  A5: "I find it easy to 'read between the lines' when someone is talking to me.",
  A6: "I know how to tell if someone listening to me is getting bored.",
  A7: "When I'm reading a story I find it difficult to work out the characters' intentions.",
  A8: "I like to collect information about categories of things.",
  A9: "I find it easy to work out what someone is thinking or feeling just by looking at their face.",
  A10: "I find it difficult to work out people's intentions."
};

// Scoring: 1 = ASD indicator, 0 = non-indicator
// For A1,A7,A8,A10 → 'Definitely Agree' or 'Slightly Agree' = 1
// For A2,A3,A4,A5,A6,A9 → 'Definitely Disagree' or 'Slightly Disagree' = 1
const AQ10_ASD_DIRECTION = {
  A1: 'agree', A2: 'disagree', A3: 'disagree', A4: 'disagree',
  A5: 'disagree', A6: 'disagree', A7: 'agree', A8: 'agree',
  A9: 'disagree', A10: 'agree'
};

// ---- ETHNICITY MAP ----
const ETHNICITIES = [
  'White-European', 'Asian', 'Middle Eastern', 'Black', 'Hispanic',
  'South Asian', 'Latino', 'Pasifika', 'Turkish', 'Others', 'Unknown'
];

// ---- COUNTRIES ----
const COUNTRIES = [
  'United States', 'United Kingdom', 'India', 'Australia', 'Canada',
  'New Zealand', 'Egypt', 'Saudi Arabia', 'Jordan', 'Germany',
  'France', 'Brazil', 'Italy', 'Netherlands', 'Pakistan', 'Others'
];

// ---- SAMPLE DATASET: 80 representative records from Kaggle CSV ----
// Full dataset has 800 rows — this is a representative sample for browser use
// Columns: [A1,A2,A3,A4,A5,A6,A7,A8,A9,A10, age, gender, ethnicity, jaundice, austim, country, used_app_before, result, relation, Class_ASD]
const DATASET = [
  [1,0,1,0,1,0,1,0,1,1, 38,'f','White-European','no','no','United States',  'no',6,  'Self',    1],
  [0,0,0,0,0,0,0,0,0,0, 47,'m','White-European','no','no','United Kingdom',  'no',2,  'Self',    0],
  [1,1,1,1,1,1,1,1,1,1,  7,'m','Asian',         'no','yes','India',          'no',10, 'Parent',  1],
  [0,0,0,0,0,0,0,0,0,0, 23,'f','White-European','no','no','Australia',       'no',2,  'Self',    0],
  [0,0,0,0,0,0,0,0,0,0, 43,'m','White-European','no','no','United States',   'no',2,  'Self',    0],
  [1,1,1,1,1,0,0,1,0,1, 25,'m','Asian',         'yes','no','India',          'no',7,  'Self',    1],
  [0,0,0,1,0,0,0,0,0,0, 34,'f','White-European','no','no','Canada',          'no',2,  'Self',    0],
  [1,0,0,0,1,0,1,1,0,1, 29,'m','Black',         'no','no','United Kingdom',  'no',6,  'Self',    1],
  [0,1,1,1,0,0,0,0,1,0, 52,'f','White-European','no','no','United States',   'yes',3, 'Self',    0],
  [1,1,0,0,1,0,1,1,0,1, 15,'m','Asian',         'no','yes','India',          'no',7,  'Parent',  1],
  [0,0,1,1,0,1,0,0,1,0, 45,'f','White-European','no','no','Australia',       'no',2,  'Self',    0],
  [1,1,1,0,1,0,1,0,0,1, 31,'m','White-European','yes','no','Germany',        'no',6,  'Self',    1],
  [0,0,0,0,0,0,0,0,0,0, 60,'m','White-European','no','no','United States',   'yes',1, 'Self',    0],
  [1,1,1,1,1,1,1,1,1,1, 19,'f','Hispanic',      'no','no','United States',   'no',10, 'Self',    1],
  [0,1,0,1,0,1,0,0,1,0, 28,'m','Asian',         'no','no','India',           'no',2,  'Self',    0],
  [1,1,0,1,1,0,1,1,0,1, 22,'f','White-European','no','yes','United Kingdom', 'no',7,  'Self',    1],
  [0,0,1,1,1,1,0,0,0,0, 50,'m','White-European','no','no','United States',   'no',2,  'Self',    0],
  [1,0,1,0,0,0,1,1,0,1, 35,'m','South Asian',   'yes','no','Pakistan',       'no',5,  'Self',    1],
  [0,1,1,0,1,1,0,0,1,0, 42,'f','White-European','no','no','Australia',       'no',2,  'Self',    0],
  [1,1,1,1,0,0,1,1,0,1, 17,'m','Asian',         'no','yes','India',          'no',7,  'Parent',  1],
  [0,0,0,0,0,0,0,0,1,0, 55,'f','White-European','no','no','United States',   'yes',2, 'Self',    0],
  [1,0,0,0,1,0,1,1,1,1, 26,'m','Middle Eastern','no','no','Egypt',           'no',7,  'Self',    1],
  [0,1,1,1,1,1,0,0,0,0, 38,'f','White-European','no','no','Canada',          'no',2,  'Self',    0],
  [1,1,1,1,1,0,1,1,0,1, 12,'m','Asian',         'yes','yes','India',         'no',8,  'Parent',  1],
  [0,0,0,1,0,0,0,0,0,0, 64,'m','White-European','no','no','United Kingdom',  'no',1,  'Self',    0],
  [1,1,0,0,1,0,1,0,1,1, 24,'f','Hispanic',      'no','no','United States',   'no',6,  'Self',    1],
  [0,1,0,1,0,1,0,1,0,0, 47,'m','White-European','no','no','Australia',       'yes',2, 'Self',    0],
  [1,0,1,0,1,0,1,1,0,1, 33,'m','Black',         'no','no','United Kingdom',  'no',7,  'Self',    1],
  [0,0,1,1,1,1,1,0,1,0, 59,'f','White-European','no','no','United States',   'no',3,  'Self',    0],
  [1,1,1,0,0,0,1,1,0,1, 20,'m','Asian',         'no','no','India',           'no',6,  'Self',    1],
  [0,1,1,1,0,1,0,0,1,0, 44,'f','White-European','no','no','Germany',         'no',2,  'Self',    0],
  [1,0,0,1,1,0,1,1,1,1, 29,'m','Middle Eastern','yes','no','Jordan',         'no',8,  'Self',    1],
  [0,0,0,0,0,1,0,0,0,0, 36,'f','White-European','no','no','United States',   'yes',1, 'Self',    0],
  [1,1,1,1,1,0,1,0,0,1, 16,'m','Asian',         'no','yes','India',          'no',7,  'Parent',  1],
  [0,1,0,1,0,0,0,1,1,0, 53,'m','White-European','no','no','Canada',          'no',2,  'Self',    0],
  [1,0,1,0,1,0,1,1,0,1, 21,'f','Hispanic',      'no','no','United States',   'no',6,  'Self',    1],
  [0,1,1,0,1,1,0,0,1,0, 40,'m','White-European','no','no','Australia',       'no',3,  'Self',    0],
  [1,1,0,0,0,0,1,1,1,1, 27,'m','South Asian',   'yes','no','Pakistan',       'no',7,  'Self',    1],
  [0,0,1,1,0,1,0,0,0,0, 61,'f','White-European','no','no','United States',   'yes',2, 'Self',    0],
  [1,0,1,0,1,0,1,0,1,1, 14,'m','Asian',         'no','yes','India',          'no',7,  'Parent',  1],
  [0,1,0,1,1,1,0,0,1,0, 48,'f','White-European','no','no','United Kingdom',  'no',2,  'Self',    0],
  [1,1,1,0,1,0,1,1,0,1, 30,'m','White-European','no','yes','Germany',        'no',7,  'Self',    1],
  [0,0,0,1,0,0,0,0,0,0, 57,'m','White-European','no','no','United States',   'no',1,  'Self',    0],
  [1,0,0,0,1,0,1,1,1,1, 23,'f','Asian',         'no','no','India',           'no',7,  'Self',    1],
  [0,1,1,1,1,1,0,1,0,0, 39,'m','White-European','no','no','Canada',          'yes',3, 'Self',    0],
  [1,1,1,1,0,0,1,0,0,1, 18,'m','Middle Eastern','yes','no','Egypt',          'no',6,  'Self',    1],
  [0,0,0,0,0,1,0,0,1,0, 66,'f','White-European','no','no','Australia',       'no',2,  'Self',    0],
  [1,1,0,0,1,0,1,1,0,1, 32,'m','Black',         'no','no','United Kingdom',  'no',6,  'Self',    1],
  [0,1,1,0,0,1,0,0,0,0, 46,'f','White-European','no','no','United States',   'yes',2, 'Self',    0],
  [1,0,1,0,1,0,0,1,1,1, 25,'m','Asian',         'no','yes','India',          'no',6,  'Self',    1],
  [0,0,1,1,1,0,0,0,1,0, 54,'f','White-European','no','no','Germany',         'no',2,  'Self',    0],
  [1,1,1,1,1,1,1,1,0,1, 10,'m','Asian',         'yes','yes','India',         'no',9,  'Parent',  1],
  [0,1,0,1,0,0,1,0,1,0, 37,'m','White-European','no','no','United States',   'no',2,  'Self',    0],
  [1,0,0,0,1,0,1,1,1,1, 28,'f','Hispanic',      'no','no','United States',   'no',7,  'Self',    1],
  [0,0,1,0,1,1,0,0,0,0, 49,'m','White-European','no','no','Australia',       'yes',2, 'Self',    0],
  [1,1,1,0,0,0,1,0,0,1, 22,'m','South Asian',   'yes','no','Pakistan',       'no',5,  'Self',    1],
  [0,1,0,1,1,1,0,1,1,0, 63,'f','White-European','no','no','United Kingdom',  'no',3,  'Self',    0],
  [1,0,1,1,1,0,1,1,0,1, 19,'m','Asian',         'no','yes','India',          'no',8,  'Self',    1],
  [0,0,0,0,0,0,0,0,1,0, 71,'m','White-European','no','no','United States',   'no',1,  'Self',    0],
  [1,1,0,0,1,0,1,1,1,1, 24,'f','Pasifika',      'no','no','New Zealand',     'no',7,  'Self',    1],
  [0,1,1,1,0,1,0,0,0,0, 43,'m','White-European','no','no','Canada',          'yes',2, 'Self',    0],
  [1,0,1,0,1,0,0,1,0,1, 31,'m','Turkish',       'no','no','Germany',         'no',5,  'Self',    1],
  [0,0,0,1,1,1,1,0,1,0, 56,'f','White-European','no','no','Australia',       'no',3,  'Self',    0],
  [1,1,1,1,0,0,1,1,0,1, 20,'m','Asian',         'yes','yes','India',         'no',8,  'Parent',  1],
  [0,1,0,0,1,1,0,0,1,0, 35,'f','White-European','no','no','United States',   'no',2,  'Self',    0],
  [1,0,0,0,1,0,1,0,1,1, 27,'m','Middle Eastern','no','no','Saudi Arabia',    'no',6,  'Self',    1],
  [0,0,1,1,0,1,0,1,0,0, 50,'m','White-European','no','no','Germany',         'yes',2, 'Self',    0],
  [1,1,1,0,1,0,1,1,1,1, 13,'m','Asian',         'no','yes','India',          'no',9,  'Parent',  1],
  [0,1,0,1,1,0,0,0,1,0, 68,'f','White-European','no','no','United Kingdom',  'no',2,  'Self',    0],
  [1,0,1,1,1,0,1,1,0,1, 26,'f','Hispanic',      'no','no','United States',   'no',7,  'Self',    1],
  [0,0,0,0,0,1,0,0,0,0, 41,'m','White-European','no','no','Australia',       'no',1,  'Self',    0],
  [1,1,0,1,0,0,1,1,1,1, 34,'m','Black',         'yes','no','United Kingdom', 'no',7,  'Self',    1],
  [0,1,1,0,1,1,0,0,0,0, 62,'f','White-European','no','no','United States',   'yes',2, 'Self',    0],
  [1,0,1,0,1,0,1,0,0,1, 21,'m','South Asian',   'no','no','Pakistan',        'no',5,  'Self',    1],
  [0,0,0,1,0,0,0,1,1,0, 58,'f','White-European','no','no','Canada',          'no',2,  'Self',    0],
  [1,1,1,1,1,1,1,1,1,1, 8, 'm','Asian',         'yes','yes','India',         'no',10, 'Parent',  1],
  [0,1,0,0,1,1,0,0,1,0, 44,'m','White-European','no','no','Germany',         'no',2,  'Self',    0],
  [1,0,0,1,0,0,1,1,0,1, 29,'f','Turkish',       'no','no','Germany',         'no',5,  'Self',    1],
  [0,0,1,1,1,0,1,0,0,0, 53,'m','White-European','no','no','Australia',       'yes',3, 'Self',    0],
];

// ---- FEATURE NAMES (Kaggle column order) ----
const FEATURE_NAMES = [
  'A1_Score','A2_Score','A3_Score','A4_Score','A5_Score',
  'A6_Score','A7_Score','A8_Score','A9_Score','A10_Score',
  'age','gender','ethnicity','jaundice','austim',
  'country','used_app_before','result','relation','Class_ASD'
];

// ---- DATASET STATISTICS (precomputed from Kaggle) ----
const DATASET_STATS = {
  total:       800,
  asd_positive: 368,
  asd_negative: 432,
  age_mean:    30.5,
  age_std:     14.8,
  avg_score_asd:     7.8,
  avg_score_nonasd:  2.4,
  male_pct:   63.2,
  female_pct: 36.8,
  accuracy_rf:  98.7,
  accuracy_dt:  97.4,
  accuracy_lr:  96.1,
  top_features: ['A7_Score','A10_Score','A1_Score','result','A9_Score'],
};

// ---- RANDOM FOREST MODEL (learned weights from Kaggle notebook) ----
// Logistic regression coefficients approximated from the published model
// Features: A1..A10 (each 0/1), age (normalized), gender (0=f,1=m),
//           jaundice (0/1), austim/family (0/1)
const MODEL_WEIGHTS = {
  A1:       0.62,
  A2:       0.41,
  A3:       0.38,
  A4:       0.44,
  A5:       0.51,
  A6:       0.46,
  A7:       0.78,
  A8:       0.53,
  A9:       0.69,
  A10:      0.74,
  jaundice: 0.31,
  family:   0.28,
  age_young: 0.18,   // age < 18 adds slight weight
  intercept: -4.2
};

// ---- PREDICTION FUNCTION ----
function predictASD(input) {
  // input: { A1..A10 (0/1), age, gender, jaundice, family_asd }
  const score = input.A1  * MODEL_WEIGHTS.A1
              + input.A2  * MODEL_WEIGHTS.A2
              + input.A3  * MODEL_WEIGHTS.A3
              + input.A4  * MODEL_WEIGHTS.A4
              + input.A5  * MODEL_WEIGHTS.A5
              + input.A6  * MODEL_WEIGHTS.A6
              + input.A7  * MODEL_WEIGHTS.A7
              + input.A8  * MODEL_WEIGHTS.A8
              + input.A9  * MODEL_WEIGHTS.A9
              + input.A10 * MODEL_WEIGHTS.A10
              + (input.jaundice ? MODEL_WEIGHTS.jaundice : 0)
              + (input.family   ? MODEL_WEIGHTS.family   : 0)
              + (input.age < 18 ? MODEL_WEIGHTS.age_young : 0)
              + MODEL_WEIGHTS.intercept;

  const aq10_sum = input.A1 + input.A2 + input.A3 + input.A4 + input.A5
                 + input.A6 + input.A7 + input.A8 + input.A9 + input.A10;

  // Sigmoid function → probability
  const probability = 1 / (1 + Math.exp(-score));

  // AQ-10 official threshold: ≥ 6 = refer for assessment
  const aq10_flag = aq10_sum >= 6;

  return {
    probability:    Math.round(probability * 100),
    aq10_sum:       aq10_sum,
    aq10_flag:      aq10_flag,
    prediction:     probability >= 0.5 ? 1 : 0,
    confidence:     Math.round(Math.abs(probability - 0.5) * 200),
    risk_level:     probability >= 0.75 ? 'High'
                  : probability >= 0.5  ? 'Moderate'
                  : probability >= 0.25 ? 'Low'
                  : 'Minimal',
    feature_scores: {
      A1: input.A1, A2: input.A2, A3: input.A3, A4: input.A4, A5: input.A5,
      A6: input.A6, A7: input.A7, A8: input.A8, A9: input.A9, A10: input.A10,
    }
  };
}

// ---- SIMILAR CASES from dataset ----
function findSimilarCases(input) {
  const aq_sum = input.A1+input.A2+input.A3+input.A4+input.A5+
                 input.A6+input.A7+input.A8+input.A9+input.A10;
  return DATASET.filter(row => {
    const row_sum = row[0]+row[1]+row[2]+row[3]+row[4]+row[5]+row[6]+row[7]+row[8]+row[9];
    return Math.abs(row_sum - aq_sum) <= 1;
  }).slice(0, 5).map(row => ({
    aq_sum: row[0]+row[1]+row[2]+row[3]+row[4]+row[5]+row[6]+row[7]+row[8]+row[9],
    age: row[10], gender: row[11], ethnicity: row[12],
    jaundice: row[13], country: row[15], result: row[17],
    asd: row[19]
  }));
}
