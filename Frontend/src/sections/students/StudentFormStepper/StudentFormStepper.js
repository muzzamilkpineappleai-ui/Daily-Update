import '../../../Styles/Students-css/StudentFormStepper/StudentFormStepper.css';
import Rectangle from '../../../assets/icons/Rectangle.png';

const StudentFormStepper = ({ steps = [], currentStep = 1 }) => {
  return (
    <div className="user-stepper-container">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        const labelClass = step.toLowerCase().replace(/\s+/g, '-');
        const positionClass = index === 0 ? 'user-first' : index === steps.length - 1 ? 'user-last' : '';

        return (
          <div key={index} className={`user-step-wrapper ${positionClass}`}>
            <div className={`user-circle ${isCompleted ? 'user-completed' : isActive ? 'user-active' : ''}`}>
              {stepNumber}
            </div>
            <div className="user-step-label-container">
              <div className={`user-step-label user-${labelClass}`}>{step}</div>
              {isActive && <img src={Rectangle} alt="active" className="user-step-rectangle" />}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StudentFormStepper;