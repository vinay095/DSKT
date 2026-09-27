import { DbEmployee, EmployeeStatusColor } from '../types/database';

const FIRST_NAMES = [
  'Aarav', 'Ananya', 'Rohan', 'Priya', 'Aditya', 'Sneha', 'Vikram', 'Neha', 'Rahul', 'Kavya',
  'Alex', 'Sarah', 'Marcus', 'Elena', 'David', 'James', 'Lucas', 'Priya', 'Sophia', 'Ethan',
  'Aaliyah', 'Benjamin', 'Chloe', 'Daniel', 'Emma', 'Felix', 'Grace', 'Henry', 'Isla', 'Jack',
  'Kabir', 'Meera', 'Tanya', 'Dev', 'Ishaan', 'Riya', 'Arjun', 'Diya', 'Karan', 'Pooja',
  'Amit', 'Sunita', 'Rajesh', 'Preeti', 'Suresh', 'Deepika', 'Manish', 'Nisha', 'Alok', 'Swati'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Patel', 'Kumar', 'Joshi', 'Mehta', 'Reddy', 'Nair',
  'Rivera', 'Jenkins', 'Vance', 'Rostova', 'Chen', 'Wilson', 'Thorne', 'Smith', 'Johnson', 'Brown',
  'Davis', 'Miller', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Clark',
  'Rao', 'Deshmukh', 'Chowdhury', 'Mukherjee', 'Bose', 'Iyengar', 'Pillai', 'Saxena', 'Kapoor', 'Malhotra'
];

const DEPARTMENTS = [
  { name: 'Engineering', teams: ['Frontend Core', 'Backend Services', 'DevOps & Infra', 'QA Automation', 'Mobile Apps'] },
  { name: 'Product', teams: ['Core UX/UI', 'Product Analytics', 'Platform Roadmap'] },
  { name: 'Design', teams: ['Brand Systems', 'Product Design', 'Research'] },
  { name: 'People & Culture', teams: ['Workplace Ops', 'Talent Acquisition', 'HRBP'] },
  { name: 'Marketing', teams: ['Growth & SEO', 'Content Strategy', 'Event Ops'] },
  { name: 'Finance & Legal', teams: ['Corporate Finance', 'Legal Compliance'] }
];

const MANAGERS = [
  'Sarah Jenkins (Head of Workplace Ops)',
  'Marcus Vance (Global Facilities Admin)',
  'David Chen (Backend Tech Lead)',
  'Elena Rostova (Lead Product Manager)',
  'James Wilson (Principal UX Architect)',
  'Aarav Sharma (Engineering Director)',
  'Vikram Joshi (VP of Product)'
];

const STATUSES: EmployeeStatusColor[] = [
  'green',
  'green',
  'green',
  'white',
  'yellow',
  'red',
  'blue',
  'orange',
  'purple',
  'teal',
];

export function generate999Employees(): DbEmployee[] {
  const employees: DbEmployee[] = [];

  // Generate 999 unique employees
  for (let i = 1; i <= 999; i++) {
    const fn = FIRST_NAMES[i % FIRST_NAMES.length];
    const ln = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
    const name = `${fn} ${ln}${i > 200 ? ` ${i}` : ''}`;
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@deskit.io`;

    const deptObj = DEPARTMENTS[i % DEPARTMENTS.length];
    const team = deptObj.teams[i % deptObj.teams.length];
    const manager = MANAGERS[i % MANAGERS.length];
    const status = STATUSES[i % STATUSES.length];

    // Primary locations: Noida 6th / 4th / Hyderabad (+ small cohorts in other offices)
    const locations: string[] = [];

    if (i <= 300) {
      locations.push('Noida 6th Floor');
    } else if (i <= 600) {
      locations.push('Noida 4th Floor');
    } else if (i <= 900) {
      locations.push('Hyderabad Office');
    } else if (i <= 930) {
      locations.push('Kolkata Office');
    } else if (i <= 965) {
      locations.push('Dubai Office');
    } else {
      locations.push('Romania Office');
    }

    // Dual-location travellers (cross-office search demos)
    if (i <= 8) {
      locations.push('Noida 4th Floor');
    } else if (i <= 16) {
      locations.push('Noida 6th Floor');
    } else if (i === 17) {
      locations.push('Hyderabad Office');
    } else if (i >= 901 && i <= 905) {
      locations.push('Noida 4th Floor');
    }

    const avatar = `https://images.unsplash.com/photo-${1500000000000 + (i % 50) * 10000}?w=150&auto=format&fit=crop&q=80`;

    employees.push({
      emp_id: `EMP-${1000 + i}`,
      name,
      email,
      team,
      manager,
      department: deptObj.name,
      locations,
      status,
      avatar,
    });
  }

  applyShowcaseEmployees(employees);
  return employees;
}

/**
 * Deterministic showcase cohort (Noida 4th + multi-office / multi-seat demos).
 * Replaces fixed EMP slots so floor seed + directory stay aligned.
 */
function applyShowcaseEmployees(employees: DbEmployee[]): void {
  const byId = new Map(employees.map((e) => [e.emp_id, e]));

  const patch = (empId: string, data: Partial<DbEmployee>) => {
    const target = byId.get(empId);
    if (!target) return;
    Object.assign(target, data);
  };

  // EMP-1301.. = Noida 4th cohort (generator i = 301+)
  patch('EMP-1301', {
    name: 'Priya Sharma',
    email: 'priya.sharma@deskit.io',
    department: 'Marketing',
    team: 'Growth & SEO',
    manager: 'Elena Rostova (Lead Product Manager)',
    status: 'green',
    locations: ['Noida 4th Floor', 'Noida 6th Floor', 'Hyderabad Office'],
    avatar:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
  });
  patch('EMP-1302', {
    name: 'David Chen',
    email: 'david.chen@deskit.io',
    department: 'Engineering',
    team: 'Backend Services',
    manager: 'Aarav Sharma (Engineering Director)',
    status: 'green',
    locations: ['Noida 4th Floor'],
  });
  patch('EMP-1303', {
    name: 'Elena Rostova',
    email: 'elena.rostova@deskit.io',
    department: 'Product',
    team: 'Platform Roadmap',
    manager: 'Vikram Joshi (VP of Product)',
    status: 'yellow',
    locations: ['Noida 4th Floor'],
  });
  patch('EMP-1304', {
    name: 'Alex Rivera',
    email: 'alex.rivera@deskit.io',
    department: 'Engineering',
    team: 'Frontend Core',
    manager: 'Aarav Sharma (Engineering Director)',
    status: 'green',
    locations: ['Noida 4th Floor'],
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  });
  patch('EMP-1305', {
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@deskit.io',
    department: 'People & Culture',
    team: 'Workplace Ops',
    manager: 'Marcus Vance (Global Facilities Admin)',
    status: 'green',
    locations: ['Noida 4th Floor'],
    avatar:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  });
  patch('EMP-1306', {
    name: 'Marcus Vance',
    email: 'marcus.vance@deskit.io',
    department: 'People & Culture',
    team: 'Workplace Ops',
    manager: 'Sarah Jenkins (Head of Workplace Ops)',
    status: 'blue',
    locations: ['Noida 4th Floor'],
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  });
  patch('EMP-1307', {
    name: 'James Wilson',
    email: 'james.wilson@deskit.io',
    department: 'Design',
    team: 'Product Design',
    manager: 'James Wilson (Principal UX Architect)',
    status: 'green',
    locations: ['Noida 4th Floor'],
  });
  patch('EMP-1308', {
    name: 'Lucas Thorne',
    email: 'lucas.thorne@deskit.io',
    department: 'Engineering',
    team: 'DevOps & Infra',
    manager: 'David Chen (Backend Tech Lead)',
    status: 'orange',
    locations: ['Noida 4th Floor'],
    avatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  });
  // Hyderabad-primary, no Noida seat — multi-office request demos
  patch('EMP-1601', {
    name: 'Kavya Reddy',
    email: 'kavya.reddy@deskit.io',
    department: 'Engineering',
    team: 'Backend Services',
    manager: 'Aarav Sharma (Engineering Director)',
    status: 'green',
    locations: ['Hyderabad Office'],
  });
}
