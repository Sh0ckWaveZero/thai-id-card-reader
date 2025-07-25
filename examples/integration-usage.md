# การใช้งาน Integration Config

## การปรับแต่ง Integration

### 1. แก้ไขไฟล์ config/integrations.json

```json
{
  "integrations": {
    "medhis": {
      "name": "MEDHIS Centrix",
      "enabled": true,
      "messageValidator": "validateMedisMessage",
      "compatibilityMode": true
    },
    "custom": [
      {
        "name": "Hospital System X",
        "enabled": false,
        "messageValidator": "validateCustomMessage",
        "messageFormat": {
          "trigger": { "action": "read_card" },
          "response": { "data": "object" }
        }
      }
    ]
  }
}
```

### 2. การเพิ่มระบบใหม่

```typescript
// เพิ่มใน messageValidator.ts
static validateCustomMessage(data: string): ValidationResult {
  try {
    const parsed = JSON.parse(data);
    
    if (parsed.action === 'read_card') {
      return {
        isValid: true,
        message: parsed as WebSocketMessage,
        integrationUsed: 'Custom System'
      };
    }
    
    return { isValid: false, error: 'Invalid custom format' };
  } catch (e) {
    return { isValid: false, error: 'Invalid JSON' };
  }
}
```

### 3. การใช้งานในโค้ด

```typescript
// แทนที่การใช้ validateMedisMessage โดยตรง
const validation = MessageValidator.validateMessage(data);

if (validation.isValid) {
  console.log(`Validated using: ${validation.integrationUsed}`);
  // ดำเนินการต่อ...
}
```

## ประโยชน์ของการแยก Config

✅ **เป็นกลาง**: ไม่ผูกติดกับ MEDHIS เท่านั้น  
✅ **ขยายได้**: เพิ่มระบบใหม่ได้ง่าย  
✅ **ปิด/เปิดได้**: สามารถปิดการรองรับระบบใดๆ ได้  
✅ **บำรุงรักษาง่าย**: แยก logic แต่ละระบบออกจากกัน  
✅ **ทดสอบง่าย**: สามารถทดสอบแต่ละ integration แยกกัน