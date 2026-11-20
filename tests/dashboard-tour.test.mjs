import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Dashboard tour component defines complete 11-step walkthroughs for both roles', () => {
  const content = fs.readFileSync(new URL('../src/components/DashboardTour.tsx', import.meta.url), 'utf8');

  // Verify freelancer tour topics
  const freelancerTopics = [
    'Welcome to POBlancer Workspace',
    'Complete Your Profile',
    'Add Portfolio & Job Experience',
    'Create Your First Service Gig',
    'Understand Service Packages & Add-ons',
    'Manage Your Services',
    'Orders & Customer Communication',
    'Payments and Earnings',
    'Account Settings & Project Support',
    'Email Notifications & Alerts',
    "You're Ready to Earn!"
  ];

  for (const topic of freelancerTopics) {
    assert.ok(content.includes(topic), `Freelancer tour must include topic: ${topic}`);
  }

  // Verify employer tour topics
  const employerTopics = [
    'Welcome to the Employer Workspace',
    'Completing & Updating Profile',
    'Finding & Exploring Freelancers & Services',
    'Searching, Filtering & Selecting Services',
    'Understanding Service Packages & Add-ons',
    'Order Services or Post a Project',
    'Direct Client-Freelancer Messaging',
    'Monitoring Orders & Delivery Progress',
    'Statements, Billing & Receipts',
    'Real-Time Alerts & Email Updates',
    'Where to Get Help or Contact Support'
  ];

  for (const topic of employerTopics) {
    assert.ok(content.includes(topic), `Employer tour must include topic: ${topic}`);
  }

  // Verify responsive and accessibility features
  assert.ok(content.includes('aria-modal="true"'), 'Tour dialog must have aria-modal attribute');
  assert.ok(content.includes('role="dialog"'), 'Tour dialog must have role="dialog"');
  assert.ok(content.includes('localStorage.setItem'), 'Tour must persist completion state');
  assert.ok(content.includes('poblancer_tour_'), 'Tour must use scoped storage keys');
});
