import ScoreGauge from "~/components/scoreGauge";
import ScoreBadge from "~/components/scoreBadge";

const Category = ({title, score}: {title:string, score:number}) => {
    const textColor = score > 70 ? 'text-green-600' : score > 49 ? 'text-yellow-600' : 'text-red-600'
    return (
        <div className="resume-summary">
            <div className="category">
                <div>
                    <p>{title}</p>
                </div>
                <p className="text-2xl">
                    <ScoreBadge score={score}/><span className={textColor}>{score}</span>/100
                </p>
            </div>
        </div>
    )
}
const Summary = ({ feedback }: { feedback: Feedback }) => {
  return (
    <div className="bg-white rounded-2xl shadow-md w-full">
        <div className="flex flex-row items-center p-4 gap-8">
            <ScoreGauge score={feedback.overallScore}/>
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold">Your Resume Score</h2>
                <p className="text-sm text-gray-500">
                    This score is based on the variables below:
                </p>
            </div>
        </div>
        <Category title="Tone & Style" score={feedback.toneAndStyle.score}/>
        <Category title="Content" score={feedback.content.score}/>
        <Category title="Skills" score={feedback.skills.score}/>
        <Category title="Structure" score={feedback.structure.score}/>
    </div>
  );
};

export default Summary;
