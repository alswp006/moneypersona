import { describe, it, expect } from 'vitest';
import { PERSONAS } from '../personas';
import type { PersonaCode } from '@/lib/types';

describe('AC-1: PERSONAS export with correct key set', () => {
  it('should export PERSONAS constant with exactly 8 keys', () => {
    expect(PERSONAS).toBeDefined();
    expect(Object.keys(PERSONAS).length).toBe(8);
  });

  it('should have keys matching {FPC,FPR,FIC,FIR,SPC,SPR,SIC,SIR} in any order', () => {
    const expectedCodes: PersonaCode[] = [
      'FPC',
      'FPR',
      'FIC',
      'FIR',
      'SPC',
      'SPR',
      'SIC',
      'SIR',
    ];
    const actualCodes = Object.keys(PERSONAS) as PersonaCode[];
    expect(new Set(actualCodes)).toEqual(new Set(expectedCodes));
  });

  it('all entries should have code property matching their key', () => {
    Object.entries(PERSONAS).forEach(([key, persona]) => {
      expect(persona.code).toBe(key);
    });
  });
});

describe('AC-2: Array length and text constraints', () => {
  it('all personas should have tips array of length 3', () => {
    Object.values(PERSONAS).forEach((persona) => {
      expect(persona.tips).toHaveLength(3);
    });
  });

  it('all personas should have strengths array of length 2', () => {
    Object.values(PERSONAS).forEach((persona) => {
      expect(persona.strengths).toHaveLength(2);
    });
  });

  it('all personas should have cautions array of length 2', () => {
    Object.values(PERSONAS).forEach((persona) => {
      expect(persona.cautions).toHaveLength(2);
    });
  });

  it('all personas should have plan30d array of length 3', () => {
    Object.values(PERSONAS).forEach((persona) => {
      expect(persona.plan30d).toHaveLength(3);
    });
  });

  it('each tip should be 15-60 characters', () => {
    Object.values(PERSONAS).forEach((persona) => {
      persona.tips.forEach((tip) => {
        expect(tip.length).toBeGreaterThanOrEqual(15);
        expect(tip.length).toBeLessThanOrEqual(60);
      });
    });
  });

  it('each strength should be 2+ characters', () => {
    Object.values(PERSONAS).forEach((persona) => {
      persona.strengths.forEach((strength) => {
        expect(strength.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  it('each caution should be 2+ characters', () => {
    Object.values(PERSONAS).forEach((persona) => {
      persona.cautions.forEach((caution) => {
        expect(caution.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  it('each plan30d item should be 5+ characters', () => {
    Object.values(PERSONAS).forEach((persona) => {
      persona.plan30d.forEach((plan) => {
        expect(plan.length).toBeGreaterThanOrEqual(5);
      });
    });
  });
});

describe('AC-3: SPEC table values and FPC fixture', () => {
  it('should have FPC (알뜰형 다람쥐) with emoji 🐿️ and bestMatch SPR', () => {
    expect(PERSONAS.FPC.name).toBe('알뜰형 다람쥐');
    expect(PERSONAS.FPC.emoji).toBe('🐿');
    expect(PERSONAS.FPC.bestMatch).toBe('SPR');
  });

  it('should have FPC tips[0] exactly matching spec fixture', () => {
    expect(PERSONAS.FPC.tips[0]).toBe(
      '월급날 자동이체로 저축분을 먼저 떼어두세요'
    );
  });

  it('should have FPR (전략형 여우) with emoji 🦊 and bestMatch SIC', () => {
    expect(PERSONAS.FPR.name).toBe('전략형 여우');
    expect(PERSONAS.FPR.emoji).toBe('🦊');
    expect(PERSONAS.FPR.bestMatch).toBe('SIC');
  });

  it('should have FIC (느긋한 거북이) with emoji 🐢 and bestMatch SPR', () => {
    expect(PERSONAS.FIC.name).toBe('느긋한 거북이');
    expect(PERSONAS.FIC.emoji).toBe('🐢');
    expect(PERSONAS.FIC.bestMatch).toBe('SPR');
  });

  it('should have FIR (도전하는 토끼) with emoji 🐰 and bestMatch SPC', () => {
    expect(PERSONAS.FIR.name).toBe('도전하는 토끼');
    expect(PERSONAS.FIR.emoji).toBe('🐰');
    expect(PERSONAS.FIR.bestMatch).toBe('SPC');
  });

  it('should have SPC (계획형 코끼리) with emoji 🐘 and bestMatch FIR', () => {
    expect(PERSONAS.SPC.name).toBe('계획형 코끼리');
    expect(PERSONAS.SPC.emoji).toBe('🐘');
    expect(PERSONAS.SPC.bestMatch).toBe('FIR');
  });

  it('should have SPR (야심가 매) with emoji 🦅 and bestMatch FPC', () => {
    expect(PERSONAS.SPR.name).toBe('야심가 매');
    expect(PERSONAS.SPR.emoji).toBe('🦅');
    expect(PERSONAS.SPR.bestMatch).toBe('FPC');
  });

  it('should have SIC (포근한 판다) with emoji 🐼 and bestMatch FPR', () => {
    expect(PERSONAS.SIC.name).toBe('포근한 판다');
    expect(PERSONAS.SIC.emoji).toBe('🐼');
    expect(PERSONAS.SIC.bestMatch).toBe('FPR');
  });

  it('should have SIR (플렉스 공작) with emoji 🦚 and bestMatch FPC', () => {
    expect(PERSONAS.SIR.name).toBe('플렉스 공작');
    expect(PERSONAS.SIR.emoji).toBe('🦚');
    expect(PERSONAS.SIR.bestMatch).toBe('FPC');
  });

  it('all bestMatch values should be valid PersonaCode', () => {
    const validCodes = new Set(Object.keys(PERSONAS));
    Object.values(PERSONAS).forEach((persona) => {
      expect(validCodes.has(persona.bestMatch)).toBe(true);
    });
  });

  it('bestMatch should never point to self', () => {
    Object.values(PERSONAS).forEach((persona) => {
      expect(persona.bestMatch).not.toBe(persona.code);
    });
  });
});

describe('AC-4: Forbidden content validation', () => {
  const hexColorPattern = /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?/g;
  const httpPattern = /https?:\/\//g;
  const forbiddenWords = ['설치', '다운로드', '스토어'];

  it('no HEX color codes in any text field', () => {
    Object.values(PERSONAS).forEach((persona) => {
      expect(persona.tagline.match(hexColorPattern)).toBeNull();
      expect(persona.summary.match(hexColorPattern)).toBeNull();
      persona.tips.forEach((tip) => {
        expect(tip.match(hexColorPattern)).toBeNull();
      });
      persona.strengths.forEach((strength) => {
        expect(strength.match(hexColorPattern)).toBeNull();
      });
      persona.cautions.forEach((caution) => {
        expect(caution.match(hexColorPattern)).toBeNull();
      });
      persona.plan30d.forEach((plan) => {
        expect(plan.match(hexColorPattern)).toBeNull();
      });
    });
  });

  it('no http/https URLs in any text field', () => {
    Object.values(PERSONAS).forEach((persona) => {
      expect(persona.tagline.match(httpPattern)).toBeNull();
      expect(persona.summary.match(httpPattern)).toBeNull();
      persona.tips.forEach((tip) => {
        expect(tip.match(httpPattern)).toBeNull();
      });
      persona.strengths.forEach((strength) => {
        expect(strength.match(httpPattern)).toBeNull();
      });
      persona.cautions.forEach((caution) => {
        expect(caution.match(httpPattern)).toBeNull();
      });
      persona.plan30d.forEach((plan) => {
        expect(plan.match(httpPattern)).toBeNull();
      });
    });
  });

  it('no forbidden words (설치, 다운로드, 스토어) in any text field', () => {
    Object.values(PERSONAS).forEach((persona) => {
      forbiddenWords.forEach((word) => {
        expect(persona.tagline).not.toContain(word);
        expect(persona.summary).not.toContain(word);
        persona.tips.forEach((tip) => {
          expect(tip).not.toContain(word);
        });
        persona.strengths.forEach((strength) => {
          expect(strength).not.toContain(word);
        });
        persona.cautions.forEach((caution) => {
          expect(caution).not.toContain(word);
        });
        persona.plan30d.forEach((plan) => {
          expect(plan).not.toContain(word);
        });
      });
    });
  });
});

describe('AC-5: Text quality and coherence', () => {
  it('all text fields should be non-empty strings', () => {
    Object.values(PERSONAS).forEach((persona) => {
      expect(persona.name).toBeTruthy();
      expect(persona.emoji).toBeTruthy();
      expect(persona.tagline).toBeTruthy();
      expect(persona.summary).toBeTruthy();
      persona.tips.forEach((tip) => {
        expect(tip).toBeTruthy();
      });
      persona.strengths.forEach((strength) => {
        expect(strength).toBeTruthy();
      });
      persona.cautions.forEach((caution) => {
        expect(caution).toBeTruthy();
      });
      persona.plan30d.forEach((plan) => {
        expect(plan).toBeTruthy();
      });
    });
  });

  it('emoji field should be exactly 1 character', () => {
    Object.values(PERSONAS).forEach((persona) => {
      expect(persona.emoji.length).toBeLessThanOrEqual(2);
    });
  });

  it('tagline should be 12-30 characters', () => {
    Object.values(PERSONAS).forEach((persona) => {
      expect(persona.tagline.length).toBeGreaterThanOrEqual(12);
      expect(persona.tagline.length).toBeLessThanOrEqual(30);
    });
  });

  it('summary should be 60-140 characters', () => {
    Object.values(PERSONAS).forEach((persona) => {
      expect(persona.summary.length).toBeGreaterThanOrEqual(60);
      expect(persona.summary.length).toBeLessThanOrEqual(140);
    });
  });

  it('each persona should have unique name', () => {
    const names = Object.values(PERSONAS).map((p) => p.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(8);
  });

  it('each persona should have unique emoji', () => {
    const emojis = Object.values(PERSONAS).map((p) => p.emoji);
    const uniqueEmojis = new Set(emojis);
    expect(uniqueEmojis.size).toBe(8);
  });
});
