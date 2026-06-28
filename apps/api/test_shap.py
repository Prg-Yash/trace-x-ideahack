import sys, os, asyncio, json
sys.path.append(r'c:\Users\YASH\OneDrive\Documents\Yash Docs\Hackathons\Idea2.0\trace-x\apps\ai-ml')
import fraud_detector

print('=== Testing SHAP is importable ===')
print('SHAP available:', fraud_detector._SHAP_AVAILABLE)

async def run_tests():
    account_id = 'ACC_00000'

    print(f'\n=== Test 1: explain_smurfing({account_id}) ===')
    r1 = await fraud_detector.explain_smurfing(account_id)
    if 'error' in r1 and not r1.get('top_factors'):
        print('ERROR:', r1['error'])
    else:
        print('Model:', r1.get('model'))
        print('Probability:', r1.get('fraud_probability'))
        print('Top factors:')
        for f in r1.get('top_factors', [])[:5]:
            bar = '#' * int(abs(f['shap_value']) * 50)
            sign = '+' if f['direction'] == 'RISK' else '-'
            print(f"  {sign}{bar:20s} {f['label']:45s}  SHAP={f['shap_value']:+.4f}  val={f['feature_value']}")
        print('Summary:', r1.get('explanation_summary'))

    print(f'\n=== Test 2: explain_kyc_mismatch({account_id}) ===')
    r2 = await fraud_detector.explain_kyc_mismatch(account_id)
    if 'error' in r2 and not r2.get('top_factors'):
        print('ERROR:', r2['error'])
    else:
        print('Model:', r2.get('model'))
        print('Probability:', r2.get('fraud_probability'))
        print('Top factors:')
        for f in r2.get('top_factors', [])[:5]:
            bar = '#' * int(abs(f['shap_value']) * 10)
            sign = '+' if f['direction'] == 'RISK' else '-'
            print(f"  {sign}{bar:20s} {f['label']:45s}  SHAP={f['shap_value']:+.4f}  val={f['feature_value']}")
        print('Summary:', r2.get('explanation_summary'))

    print(f'\n=== Test 3: explain_dormant({account_id}) ===')
    r3 = await fraud_detector.explain_dormant(account_id)
    if 'error' in r3 and not r3.get('top_factors'):
        print('ERROR:', r3['error'])
    else:
        print('Model:', r3.get('model'))
        print('Is Anomaly:', r3.get('is_anomaly'))
        print('Anomaly Score:', r3.get('anomaly_score'))
        print('Top factors:')
        for f in r3.get('top_factors', [])[:5]:
            bar = '#' * int(abs(f['shap_value']) * 50)
            sign = '+' if f['direction'] == 'RISK' else '-'
            print(f"  {sign}{bar:20s} {f['label']:45s}  SHAP={f['shap_value']:+.4f}  val={f['feature_value']}")
        print('Summary:', r3.get('explanation_summary'))

    print(f'\n=== Test 4: explain_account({account_id}) [MASTER] ===')
    r4 = await fraud_detector.explain_account(account_id)
    print('Generated at:', r4.get('generated_at'))
    print('Models used:', r4.get('models_used'))
    print('Top 10 risk factors across ALL models:')
    for i, f in enumerate(r4.get('top_risk_factors', [])[:10], 1):
        sign = '+' if f['direction'] == 'RISK' else '-'
        print(f"  {i:2d}. [{f.get('fraud_type','?'):22s}] {sign}  {f['label']:45s}  SHAP={f['shap_value']:+.5f}")

asyncio.run(run_tests())
