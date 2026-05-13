import type { PersonalityArchetype } from '../../data/gameTypes';
import { getPersonalityGraphicSVG } from '../../data/personalityMappings';
import { PERSONALITY_CHARACTERS } from '../../data/personalities';

interface Props {
  result: PersonalityArchetype;
  personalityId?: number;
  cardTitle: string;
  pathKey: string;
}

export function PrescriptionCard({ result, personalityId, cardTitle, pathKey }: Props) {
  return (
    <>
      {personalityId && (
        <div className="result-left-graphic" dangerouslySetInnerHTML={{ __html: getPersonalityGraphicSVG(personalityId) }} />
      )}
      {personalityId && PERSONALITY_CHARACTERS[personalityId] && (
        <div className="result-right-character">
          <img src={PERSONALITY_CHARACTERS[personalityId]} alt="" />
        </div>
      )}
      <div className="prescription-card">
        <div className="pc-watermark" />
        <div className="pc-badge">PERSONALITY DIAGNOSIS</div>
        <div className="pc-persona">{result.persona}</div>
        <div className="pc-path">
          基于「{cardTitle}」· 路径 {pathKey}
        </div>
        <div className="pc-section">
          <h3>【诊断结果】</h3>
          <div className="pc-diagnosis">{result.dia}</div>
        </div>
        <div className="pc-section">
          <h3>【处方】Rp.</h3>
          <div className="pc-med-box">
            <div className="pc-med-name">{result.med}</div>
            <div className="pc-med-usage">
              <strong>用法用量：</strong>
              {result.usage}
            </div>
          </div>
        </div>
        <div className="pc-section">
          <h3>【医嘱】</h3>
          <div className="pc-advice">{result.advice}</div>
        </div>
      </div>
    </>
  );
}

export function getFallbackResult(): PersonalityArchetype {
  return {
    id: 0,
    persona: '「独特的体验者」',
    dia: '你的选择组合非常特别，在数据库中找不到完全匹配的人格档案。这说明你是一个无法被简单分类的人——恭喜，这是最高级别的赞美。你的灵魂拒绝被标签化，你的每一个选择都来自当下的真实感受，而不是任何预设的模式。继续保持这样活着。',
    med: '「做自己」终身处方',
    usage: '不需要任何用法。你已经在做了。',
    advice:
      '你是一个无法被归类的人。在这个人人都想做标准答案的世界里，你选择做一道开放题。你不需要处方——你本身就是解药。',
  };
}
