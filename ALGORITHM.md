# Period Prediction Algorithm - Deep Dive

## Overview

The period prediction algorithm is the core feature of this application. It uses statistical analysis and weighted moving averages to predict menstrual cycles with high accuracy for regular cycles and reasonable accuracy for irregular cycles.

## Algorithm Design Philosophy

### Goals
1. **Accuracy**: Provide reliable predictions for regular cycles
2. **Adaptability**: Handle irregular cycles gracefully
3. **Transparency**: Communicate confidence levels clearly
4. **Personalization**: Learn from individual patterns

### Challenges Addressed
1. **Cold Start Problem**: Limited or no historical data
2. **Cycle Variability**: Natural fluctuations in cycle length
3. **Data Quality**: Incomplete or inconsistent user input
4. **Edge Cases**: Pregnancy, medical conditions, etc.

## Mathematical Foundation

### 1. Cycle Length Calculation

**Definition**: Days between the start of one period and the start of the next.

```
Cycle Length = Days(Period[n].start_date - Period[n-1].start_date)
```

**Data Validation**:
- Only cycles between 21-45 days are considered valid
- This filters out data entry errors and unusual medical situations

### 2. Weighted Moving Average

The algorithm uses a **weighted moving average** where recent data has more influence on predictions.

```
Weighted Cycle Length = (R × 0.5) + (M × 0.3) + (O × 0.2)

Where:
  R = Average of most recent 3 cycles
  M = Average of middle 3 cycles (cycles 4-6)
  O = Average of older cycles (cycles 7+)
```

**Why Weighted?**
- Recent cycles better reflect current patterns
- Accounts for gradual changes in cycle regularity
- More responsive to pattern shifts (e.g., stress, lifestyle changes)

**Example Calculation**:
```
Cycle History: [28, 29, 27, 28, 30, 28, 29, 27] days

Recent (last 3): [28, 29, 27] → Average = 28.0
Middle (next 3): [28, 30, 28] → Average = 28.7
Older (rest):    [29, 27]     → Average = 28.0

Weighted = (28.0 × 0.5) + (28.7 × 0.3) + (28.0 × 0.2)
        = 14.0 + 8.61 + 5.6
        = 28.21 days
```

### 3. Statistical Analysis - Standard Deviation

Standard deviation (σ) measures cycle variability:

```
σ = √(Σ(xi - μ)² / n)

Where:
  xi = individual cycle length
  μ = mean cycle length
  n = number of cycles
```

**Regularity Classification**:

| σ (days) | Classification | Description |
|----------|---------------|-------------|
| < 2 | Very Regular | Cycle varies by ±1 day |
| 2-4 | Regular | Cycle varies by 2-3 days |
| 4-7 | Somewhat Irregular | Cycle varies by 4-6 days |
| ≥ 7 | Irregular | High unpredictability |

**Example**:
```
Cycles: [28, 29, 28, 27, 28]
Mean (μ) = 28.0
Deviations: [0, 1, 0, -1, 0]
Squared: [0, 1, 0, 1, 0]
Sum = 2
σ = √(2/5) = 0.63 → Very Regular
```

### 4. Confidence Score Calculation

The confidence score (0.40 - 0.95) combines multiple factors:

```
Confidence = Base_Confidence + Data_Boost + Cycle_Adjustment

Where:
  Base_Confidence = f(standard_deviation)
  Data_Boost = min(cycles_tracked / 12, 1.0) × 0.08
  Cycle_Adjustment = cycle_length_penalty
```

**Base Confidence by Regularity**:
- σ < 2: Base = 0.92 (very predictable)
- σ 2-4: Base = 0.82 (predictable)
- σ 4-7: Base = 0.67 (moderately predictable)
- σ ≥ 7: Base = 0.50 (unpredictable)

**Data Quality Boost**:
- More tracked cycles → higher confidence
- Maximum boost: +0.08 at 12+ cycles
- Linear scaling: each cycle adds ~0.67% confidence

**Cycle Length Adjustment**:
- Typical cycles (26-32 days): No penalty
- Atypical cycles: -0.05 penalty
- Rationale: Unusual cycles are harder to predict

**Example Calculation**:
```
Scenario: 8 cycles tracked, σ = 3.2, avg_cycle = 28 days

Base_Confidence = 0.82 (σ between 2-4)
Data_Boost = (8/12) × 0.08 = 0.053
Cycle_Adjustment = 0 (typical cycle)

Confidence = 0.82 + 0.053 + 0 = 0.873 → 87.3%
```

### 5. Ovulation Prediction

Based on biological principles:

```
Ovulation_Day = Next_Period_Start - 14 days
Fertile_Window_Start = Ovulation_Day - 5 days
Fertile_Window_End = Ovulation_Day + 1 day
```

**Biological Basis**:
- Luteal phase (post-ovulation) is consistently ~14 days
- Sperm can survive up to 5 days
- Egg viable for ~24 hours after ovulation

**7-day fertile window** = 5 days before + ovulation day + 1 day after

## Algorithm Flow

### High-Level Flow

```
START
  ↓
Get User's Last 12 Periods
  ↓
Sufficient Data? (≥3 cycles)
  ↓ Yes              ↓ No
  ↓                  ↓
Calculate          Use Default
Statistics         Prediction
  ↓                  ↓
Weighted           ↓
Average            ↓
  ↓                  ↓
Predict           Predict
Next Period       Next Period
  ↓                  ↓
Calculate         Calculate
Ovulation         Ovulation
  ↓                  ↓
Compute           Low
Confidence        Confidence
  ↓                  ↓
Save              Save
Prediction        Prediction
  ↓
RETURN RESULT
```

### Detailed Pseudocode

```python
function predictNextPeriod(userId):
    # Step 1: Fetch historical data
    periods = getLastNPeriods(userId, 12, whereComplete=True)
    
    # Step 2: Check data sufficiency
    if len(periods) < 3:
        return useDefaultPrediction(userId, periods)
    
    # Step 3: Calculate cycle lengths with validation
    cycleLengths = []
    for i in range(len(periods) - 1):
        cycleLength = daysBetween(periods[i+1].start, periods[i].start)
        if 21 <= cycleLength <= 45:  # Validate
            cycleLengths.append(cycleLength)
    
    # Step 4: Calculate statistics
    avgCycleLength = mean(cycleLengths)
    stdDev = standardDeviation(cycleLengths)
    
    # Step 5: Weighted average for prediction
    recent = mean(cycleLengths[0:3])
    middle = mean(cycleLengths[3:6]) if len(cycleLengths) >= 6 else recent
    older = mean(cycleLengths[6:]) if len(cycleLengths) > 6 else middle
    
    if len(cycleLengths) <= 3:
        predictedLength = recent
    elif len(cycleLengths) <= 6:
        predictedLength = recent * 0.7 + middle * 0.3
    else:
        predictedLength = recent * 0.5 + middle * 0.3 + older * 0.2
    
    # Step 6: Predict dates
    lastPeriodStart = periods[0].start_date
    predictedStart = addDays(lastPeriodStart, round(predictedLength))
    
    # Calculate period duration
    periodLengths = [daysBetween(p.start, p.end) + 1 for p in periods if p.end]
    avgPeriodLength = mean(periodLengths) or 5
    predictedEnd = addDays(predictedStart, round(avgPeriodLength) - 1)
    
    # Step 7: Ovulation calculation
    ovulationDay = addDays(predictedStart, -14)
    fertileStart = addDays(ovulationDay, -5)
    fertileEnd = addDays(ovulationDay, 1)
    
    # Step 8: Confidence score
    confidence = calculateConfidence(stdDev, len(cycleLengths), avgCycleLength)
    
    # Step 9: Save and return
    savePrediction(userId, predictedStart, predictedEnd, fertileStart, fertileEnd, confidence)
    
    return {
        predicted_start: predictedStart,
        predicted_end: predictedEnd,
        ovulation_start: fertileStart,
        ovulation_end: fertileEnd,
        confidence: confidence,
        stats: {
            avg_cycle: avgCycleLength,
            avg_period: avgPeriodLength,
            regularity: classifyRegularity(stdDev),
            cycles_tracked: len(cycleLengths)
        }
    }
```

## Implementation Details

### Code Location
`backend/src/services/predictionService.ts`

### Key Methods

1. **`predictNextPeriod(userId)`**
   - Main entry point
   - Returns single prediction with statistics

2. **`predictMultipleCycles(userId, n)`**
   - Predicts next N cycles
   - Uses recursive application of average cycle length
   - Confidence decreases by 5% per cycle

3. **`calculateCycleStats(periods)`**
   - Computes all statistical measures
   - Returns structured stats object

4. **`calculateWeightedCycleLength(periods)`**
   - Implements weighted moving average
   - Handles variable data availability

5. **`calculateConfidence(stdDev, dataPoints, avgCycle)`**
   - Multi-factor confidence calculation
   - Returns score between 0.40 and 0.95

### Edge Cases Handled

1. **Insufficient Data**
   - < 3 cycles: Uses user settings or defaults
   - Confidence capped at 0.40 + (cycles × 0.1)

2. **Irregular Cycles**
   - High standard deviation → lower confidence
   - Still provides prediction with clear uncertainty

3. **Data Quality Issues**
   - Filters unrealistic cycle lengths (< 21 or > 45 days)
   - Excludes incomplete periods (no end date)

4. **First-Time Users**
   - Uses default values (28-day cycle, 5-day period)
   - Prompts for data entry to improve accuracy

## Real-World Examples

### Example 1: Very Regular Cycle

**Data**:
```
Cycles: [28, 28, 29, 28, 28, 27, 28, 29]
```

**Calculation**:
```
Recent 3: [28, 28, 29] → 28.33
Middle 3: [28, 28, 27] → 27.67
Older 2: [28, 29] → 28.5

Weighted = 28.33×0.5 + 27.67×0.3 + 28.5×0.2
        = 14.17 + 8.30 + 5.70
        = 28.17 days

Standard Deviation = 0.64 days
Regularity: Very Regular
Confidence: 92%

Prediction: Next period in 28 days
```

### Example 2: Somewhat Irregular Cycle

**Data**:
```
Cycles: [26, 31, 28, 29, 27, 33, 26]
```

**Calculation**:
```
Recent 3: [26, 31, 28] → 28.33
Middle 3: [29, 27, 33] → 29.67
Older 1: [26] → 26.0

Weighted = 28.33×0.5 + 29.67×0.3 + 26.0×0.2
        = 14.17 + 8.90 + 5.20
        = 28.27 days

Standard Deviation = 2.60 days
Regularity: Regular
Confidence: 78%

Prediction: Next period in 28 days (±3 days)
```

### Example 3: Insufficient Data

**Data**:
```
Cycles: [29, 27]
```

**Calculation**:
```
Only 2 cycles → Insufficient data

Uses default or user settings:
- Cycle length: 28 days
- Period length: 5 days

Confidence: 40% (low due to limited data)

Prediction: Next period in 28 days
Note: "Add more cycles for accurate predictions"
```

## Testing the Algorithm

### Unit Test Scenarios

1. **Regular Cycles** (σ < 2)
   - Input: 8 cycles, all 28±1 days
   - Expected: 28-day prediction, 90-95% confidence

2. **Slightly Irregular** (σ = 3)
   - Input: 7 cycles, range 26-30 days
   - Expected: Weighted average, 75-85% confidence

3. **Irregular Cycles** (σ = 6)
   - Input: 6 cycles, range 24-35 days
   - Expected: Conservative prediction, 50-65% confidence

4. **Cold Start** (< 3 cycles)
   - Input: 2 cycles
   - Expected: Default prediction, 40-50% confidence

5. **Perfect Cycles** (all identical)
   - Input: 12 cycles, all exactly 28 days
   - Expected: 28-day prediction, 95% confidence

### Manual Testing

Use the seeded demo data:
1. Login to application
2. View prediction card
3. Add new period with different characteristics
4. Observe how prediction and confidence change

## Algorithm Limitations

### Current Limitations

1. **Linear Assumptions**
   - Assumes cycle patterns continue linearly
   - Doesn't detect trend changes (lengthening/shortening)

2. **Biological Simplifications**
   - Fixed 14-day luteal phase assumption
   - Doesn't account for anovulatory cycles

3. **External Factors**
   - No consideration for stress, travel, illness
   - Doesn't integrate with other health metrics

4. **Data Requirements**
   - Requires 3+ cycles for reasonable accuracy
   - Best with 6-12 cycles of data

### Future Enhancements

1. **Machine Learning**
   - LSTM networks for pattern recognition
   - Feature engineering (age, season, etc.)
   - Personalized models per user

2. **Advanced Statistics**
   - Time series analysis (ARIMA)
   - Trend detection algorithms
   - Anomaly detection for unusual cycles

3. **Multi-Factor Integration**
   - Basal body temperature
   - Cervical mucus observations
   - LH surge detection

4. **Adaptive Learning**
   - User feedback loop
   - Correction-based model updates
   - Dynamic weight adjustment

## References & Research

### Scientific Basis

1. **Cycle Length Variability**
   - Mihm et al. (2011): "The normal menstrual cycle"
   - Average cycle: 28±7 days
   - Luteal phase: 14±2 days (more consistent)

2. **Prediction Methods**
   - Bull et al. (2019): "Real-world menstrual cycle characteristics"
   - Statistical approaches for cycle prediction
   - Weighted averages outperform simple averages

3. **Ovulation Timing**
   - Wilcox et al. (2000): "Timing of sexual intercourse"
   - Fertile window: 6 days ending on ovulation day
   - Highest probability: 2 days before ovulation

### Algorithm Design Inspirations

- Moving Average Convergence Divergence (MACD) from finance
- Time series forecasting techniques
- Bayesian updating for confidence scores
- Apps: Flo, Clue, Natural Cycles

## Conclusion

This prediction algorithm balances:
- **Simplicity**: Easy to understand and debug
- **Accuracy**: Highly accurate for regular cycles
- **Robustness**: Handles edge cases gracefully
- **Transparency**: Clear confidence communication

The weighted moving average approach, combined with statistical analysis, provides reliable predictions while remaining computationally efficient and scalable.
