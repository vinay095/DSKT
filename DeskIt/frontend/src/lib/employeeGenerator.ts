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

const STATUSES: EmployeeStatusColor[] = ['green', 'green', 'green', 'white', 'yellow', 'red', 'blue', 'orange'];

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

    // Assign Locations based on requested exact distribution:
    // 333 Noida 6th, 333 Noida 4th, 350 Hyderabad (Total = 1016 location slots across 999 employees)
    const locations: string[] = [];

    if (i <= 325) {
      locations.push('Noida 6th Floor');
    } else if (i <= 650) {
      locations.push('Noida 4th Floor');
    } else {
      locations.push('Hyderabad Office');
    }

    // Assign dual-location privileges to 17 employees (e.g. 1 to 17) to reach exact totals:
    // 333 Noida 6th (+8), 333 Noida 4th (+8), 350 Hyderabad (+1)
    if (i <= 8) {
      locations.push('Noida 4th Floor');
    } else if (i <= 16) {
      locations.push('Noida 6th Floor');
    } else if (i === 17) {
      locations.push('Hyderabad Office');
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

  return employees;
}
