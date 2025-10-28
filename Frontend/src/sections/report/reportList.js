import { useNavigate } from 'react-router-dom';  
import '../../Styles/Report/reportList.css';
import PaymentIcon from '../../assets/icons/paymentIcon.png';
import ExamIcon from '../../assets/icons/examIcon.png';
import ResultIcon from '../../assets/icons/resultIcon.png';

export default function ReportList() {
  const navigate = useNavigate();  
  const cards = [
    { id: 'payments', title: 'Payments', path: '/report/paymentReport', icon: PaymentIcon }, 
    { id: 'exams', title: 'Exams', path: '/report/examReport', icon: ExamIcon },
    { id: 'result', title: 'Result', path: '/report/resultReport', icon: ResultIcon },
  ];

  const handleNavigation = (path) => {
    navigate(path); 
  };

  return (
    <div className="report-container">
      <div className="report-cards-wrapper">
        {cards.map((card) => (
          <div
            key={card.id}
            className="nav-card"
            onClick={() => handleNavigation(card.path)}
          >
            <div className="icon-placeholder">
              <img src={card.icon} alt={`${card.title} icon`} className="icon-report" />
            </div>
            <span className="card-title">{card.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}