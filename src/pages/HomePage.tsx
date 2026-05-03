import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import IdentityTag from '../components/IdentityTag';
import { identityTags } from '../utils/identityTags';
import { useAppContext } from '../contexts/AppContext';

export default function HomePage() {
  const { identityTag, setIdentityTag } = useAppContext();
  const navigate = useNavigate();

  const handleTagClick = (tagId: string) => {
    setIdentityTag(tagId);
    navigate('/consultation');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        subtitle="三甲资质 · 专治精神内耗 · 不靠谱但走心"
      />

      <main className="flex-1 flex flex-col items-center px-4 pb-8 max-w-lg mx-auto w-full">
        {/* 发疯文学引导语 */}
        <div className="text-center mb-6 px-2">
          <p className="text-amber-200/80 text-sm leading-relaxed mb-3">
            欢迎来到全网第一家也是最后一家赛博精神理疗院。
          </p>
          <p className="text-purple-300/70 text-xs leading-relaxed">
            我们不用冷冰冰的量表，只靠AI老中医的望闻问切（主要是"闻"——闻你吐槽的浓度）。
            <br />
            请先选择一个你的互联网身份，然后开始跟华佗聊聊。
            <br />
            <span className="text-amber-400/60">放心，不收费，不卖课，不说"你要学会爱自己"。</span>
          </p>
        </div>

        {/* 身份标签选择 */}
        <h2 className="text-amber-300/80 text-sm font-bold mb-3 tracking-wider self-start">
          👇 请选择你的挂号科别
        </h2>

        <div className="grid gap-3 w-full">
          {identityTags.map((tag) => (
            <IdentityTag
              key={tag.id}
              {...tag}
              selected={identityTag === tag.id}
              onClick={handleTagClick}
            />
          ))}
        </div>

        {/* 底部免责声明 */}
        <p className="mt-6 text-xs text-purple-500/40 text-center leading-relaxed">
          本测试仅供娱乐，不具备临床诊断效度。
          <br />
          如果你真的很难受，请一定去找真正的心理咨询师。
          <br />
          —— 不过在此之前，先跟华佗聊聊也行。
        </p>
      </main>
    </div>
  );
}
