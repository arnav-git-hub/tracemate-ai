// cases.js — All three demo cases with full data
// ============================================================

export const CASES = [
  {
    id: 'case-001',
    number: '001',
    title: 'The Missing Item',
    tagline: 'A loop that never reaches the end',
    language: 'Python',
    difficulty: 'easy',
    category: 'Off-by-one Error',

    snippet: `items = ["apple", "banana", "cherry", "date"]

def print_items(items):
    for i in range(len(items) - 1):
        print(items[i])

print_items(items)`,

    predict: {
      question: 'What will this code print when executed?',
      options: [
        { id: 'a', text: 'All four items: apple, banana, cherry, date' },
        { id: 'b', text: 'Only the first three: apple, banana, cherry' },
        { id: 'c', text: 'A crash with IndexError' },
        { id: 'd', text: 'Only the first item: apple' },
      ],
      correctId: 'b',
      actualBehavior: 'The code prints only the first three items — apple, banana, cherry — silently skipping "date".',
    },

    diagnosis: {
      summary: 'A range boundary is set one too low, causing the loop to terminate before the last element is processed.',
      rootCause: '`range(len(items) - 1)` generates indices 0, 1, 2 — stopping short of index 3 (the last element "date").',
      confidence: 'high',
      confidenceNote: 'The code is deterministic. There is exactly one off-by-one boundary error and no other plausible cause.',
      evidence: [
        { line: 4, description: '`range(len(items) - 1)` with a 4-element list produces range(3) → [0, 1, 2]. Index 3 is never reached.' },
        { line: 5, description: '`items[i]` is only ever called for i ∈ {0, 1, 2}. `items[3]` ("date") is never accessed.' },
      ],
      steps: [
        'Python\'s `len(items)` returns 4 for a 4-element list.',
        '`range(len(items) - 1)` becomes `range(3)`, which yields 0, 1, 2.',
        'The loop body runs three times — for "apple", "banana", "cherry".',
        '"date" is at index 3. Because range stops at 2, it is never visited.',
        'No error is raised. The omission is completely silent.',
      ],
      otherCauses: [
        'If someone modified the list to be empty, range(-1) would still not raise an error — it would just produce an empty range.',
      ],
      nextAction: 'Change the loop boundary so it covers all indices, or use a direct for-each loop.',
    },

    fix: {
      original: `items = ["apple", "banana", "cherry", "date"]

def print_items(items):
    for i in range(len(items) - 1):
        print(items[i])

print_items(items)`,
      corrected: `items = ["apple", "banana", "cherry", "date"]

def print_items(items):
    for item in items:
        print(item)

print_items(items)`,
      // highlight lines (1-based) in corrected version
      changedLines: { 4: 'add' },
      removedLines: { 4: 'remove' },   // in original
      changes: [
        {
          what: 'Replaced index-based loop with direct iteration',
          why: 'Iterating directly over the list (`for item in items`) is idiomatic Python and eliminates the off-by-one risk entirely. There is no manual index arithmetic to get wrong.',
        },
      ],
      alternative: `# Alternative: fix the range boundary
for i in range(len(items)):   # or range(0, len(items))
    print(items[i])`,
    },

    tests: [
      {
        name: 'Last item is included in output',
        code: `items = ["apple", "banana", "cherry", "date"]
output = []
for item in items:
    output.append(item)
assert output[-1] == "date", f"Expected 'date', got '{output[-1]}'"
print("PASS: last item 'date' is included")`,
        expectedResult: 'PASS',
        note: 'This assertion would fail against the original buggy code.',
      },
      {
        name: 'All items are printed',
        code: `items = ["apple", "banana", "cherry", "date"]
output = []
for item in items:
    output.append(item)
assert len(output) == 4, f"Expected 4 items, got {len(output)}"
print("PASS: all 4 items present")`,
        expectedResult: 'PASS',
      },
    ],

    lesson: {
      concept: 'Off-by-one Errors & Loop Boundaries',
      beginner: {
        analogy: 'Imagine a teacher calling on students by row number. If the classroom has 4 rows but the teacher only calls rows 1 through 3, the last row is never heard from — no one complains, they\'re just silently skipped.',
        explanation: 'An off-by-one error happens when a loop starts or ends one step too early or too late. Because the code doesn\'t crash, these bugs can hide in production for a long time. In Python, `range(n)` gives you 0 through n-1. If you write `range(len(list) - 1)`, you get 0 through n-2 — one short.',
        rule: 'When looping over a list, always prefer `for item in list` over index arithmetic. Save `range(len(...))` for when you genuinely need the index.',
      },
      intermediate: {
        analogy: 'Half-open intervals are everywhere in computing — array indices, substring ranges, slice notation. The convention is [start, end) where end is excluded. Accidentally applying that exclusion to a manually computed end introduces a subtle off-by-one.',
        explanation: '`range(n)` is a half-open interval [0, n). When you write `range(len(items) - 1)`, you\'re creating [0, len(items)-1), which ends at len(items)-2 — two short of the list length. The Pythonic idiom `for item in list` delegates boundary management to the iterator protocol, making this class of mistake impossible.',
        rule: 'Off-by-one errors most commonly appear at manual range boundaries, slice endpoints, and while-loop conditions. When in doubt, test with a list of exactly 1 element and exactly 0 elements.',
      },
      advanced: {
        analogy: 'This is a classic fencepost problem: n fence sections require n+1 posts. Confusing "number of sections" with "number of posts" is an off-by-one error in counting discrete intervals.',
        explanation: 'The bug lives in index arithmetic: `range(len(items) - 1)` produces indices [0, len-2], skipping the last. Python\'s iterator protocol (`__iter__`/`__next__`) handles boundary computation correctly and is O(1) memory. Using it is strictly safer than manual index arithmetic and generates identical bytecode via the C-level list iterator. For large sequences, consider using `enumerate()` when both index and value are needed.',
        rule: 'Prefer iteration over indexing. When indexing is unavoidable, write a boundary test with n=0, n=1, and n=max to catch off-by-one conditions before they reach production.',
      },
      quiz: [
        {
          question: 'What does `range(5)` produce?',
          options: ['0, 1, 2, 3, 4, 5', '0, 1, 2, 3, 4', '1, 2, 3, 4, 5', '1, 2, 3, 4'],
          correctIndex: 1,
          explanation: '`range(5)` produces 0, 1, 2, 3, 4 — five values starting from 0, stopping before 5. It is a half-open interval [0, 5).',
        },
        {
          question: 'You have a list with 6 elements. `range(len(my_list) - 1)` produces how many indices?',
          options: ['6', '5', '4', '7'],
          correctIndex: 1,
          explanation: 'len(my_list) = 6, so range(6-1) = range(5) = [0, 1, 2, 3, 4] — 5 indices. The last element at index 5 is skipped.',
        },
        {
          question: 'Which loop style eliminates off-by-one errors entirely when printing every item?',
          options: [
            'for i in range(len(items) - 1)',
            'for i in range(len(items))',
            'for item in items',
            'while i <= len(items)',
          ],
          correctIndex: 2,
          explanation: '`for item in items` uses Python\'s built-in iterator, which handles all boundary logic internally. There is no manual index to miscalculate.',
        },
      ],
      practiceChallenge: {
        title: 'Fix the sum function',
        description: 'The function below sums only the first n-1 numbers in a list. Fix it so all numbers are included.',
        code: `def sum_all(numbers):
    total = 0
    for i in range(len(numbers) - 1):
        total += numbers[i]
    return total

print(sum_all([1, 2, 3, 4, 5]))  # Should print 15, currently prints 10`,
        hint: 'Change the range boundary, or switch to a direct iteration.',
      },
    },
  },

  // ── CASE 002 ─────────────────────────────────────────────
  {
    id: 'case-002',
    number: '002',
    title: 'The Vanishing Result',
    tagline: 'An answer that never arrives',
    language: 'JavaScript',
    difficulty: 'medium',
    category: 'Async / Await',

    snippet: `async function fetchUserName(userId) {
  const response = await fetch(\`/api/users/\${userId}\`);
  const data = await response.json();
  return data.name;
}

async function greetUser(userId) {
  const name = fetchUserName(userId);   // ← missing await
  console.log(\`Hello, \${name}!\`);
}

greetUser(42);`,

    predict: {
      question: 'What will `console.log` print?',
      options: [
        { id: 'a', text: 'Hello, Alice! (the fetched name)' },
        { id: 'b', text: 'Hello, [object Promise]! (a Promise, not the value)' },
        { id: 'c', text: 'A TypeError is thrown immediately' },
        { id: 'd', text: 'Hello, undefined! (undefined name)' },
      ],
      correctId: 'b',
      actualBehavior: 'The log prints `Hello, [object Promise]!` — the name variable holds an unresolved Promise object, not the string value.',
    },

    diagnosis: {
      summary: 'An async function call is missing the `await` keyword, so the assignment captures a pending Promise rather than the resolved value.',
      rootCause: 'Without `await`, `fetchUserName(userId)` returns immediately with a Promise object. JavaScript does not pause execution at that line, so `name` is a Promise rather than a string.',
      confidence: 'high',
      confidenceNote: 'This is a classic and unambiguous async/await misuse. The symptom matches exactly — calling an async function without await yields a Promise.',
      evidence: [
        { line: 8, description: '`const name = fetchUserName(userId)` — no `await`. `fetchUserName` is an async function, so it returns a Promise. Without await, the Promise is assigned directly to `name`.' },
        { line: 9, description: '`console.log(`Hello, ${name}!`)` — template literal coerces the Promise object to its string representation: "[object Promise]".' },
      ],
      steps: [
        '`fetchUserName` is declared `async`, so calling it always returns a Promise.',
        'On line 8, no `await` keyword is present. JavaScript does not wait for the Promise to resolve.',
        'The Promise object itself is assigned to `name`.',
        'When the template literal is evaluated, JavaScript calls `.toString()` on the Promise, producing "[object Promise]".',
        'The actual user name is eventually resolved inside the Promise, but is never captured.',
      ],
      otherCauses: [
        'If `greetUser` were not declared `async`, using `await` inside it would throw a SyntaxError. But since it is already async, adding `await` is the correct and complete fix.',
      ],
      nextAction: 'Add `await` before `fetchUserName(userId)` on line 8.',
    },

    fix: {
      original: `async function fetchUserName(userId) {
  const response = await fetch(\`/api/users/\${userId}\`);
  const data = await response.json();
  return data.name;
}

async function greetUser(userId) {
  const name = fetchUserName(userId);   // ← missing await
  console.log(\`Hello, \${name}!\`);
}

greetUser(42);`,
      corrected: `async function fetchUserName(userId) {
  const response = await fetch(\`/api/users/\${userId}\`);
  const data = await response.json();
  return data.name;
}

async function greetUser(userId) {
  const name = await fetchUserName(userId);  // ✓ awaited
  console.log(\`Hello, \${name}!\`);
}

greetUser(42);`,
      changedLines: { 8: 'add' },
      removedLines: { 8: 'remove' },
      changes: [
        {
          what: 'Added `await` before `fetchUserName(userId)`',
          why: 'Adding `await` tells JavaScript to pause execution of `greetUser` until the Promise returned by `fetchUserName` resolves. Only then is the resolved string value assigned to `name`.',
        },
      ],
    },

    tests: [
      {
        name: 'Without await — returns a Promise, not a string',
        code: `// Deterministic simulation (no real fetch needed)
async function fakeUserName() {
  return "Alice";
}

async function buggyGreet() {
  const name = fakeUserName();   // no await
  return typeof name;            // should be 'object' (Promise), not 'string'
}

buggyGreet().then(t => {
  console.assert(t === 'object', 'BUG: name should be a Promise');
  console.log('BEFORE FIX — type is: ' + t);   // 'object'
});`,
        expectedResult: 'FAIL',
        note: 'This demonstrates the bug: name is a Promise object.',
      },
      {
        name: 'With await — returns the resolved string',
        code: `async function fakeUserName() {
  return "Alice";
}

async function fixedGreet() {
  const name = await fakeUserName();  // with await
  return typeof name;                 // should be 'string'
}

fixedGreet().then(t => {
  console.assert(t === 'string', 'name should now be a string');
  console.log('AFTER FIX — type is: ' + t);    // 'string'
});`,
        expectedResult: 'PASS',
      },
    ],

    lesson: {
      concept: 'Asynchronous JavaScript — Promises & async/await',
      beginner: {
        analogy: 'Imagine ordering a pizza. When you call the pizza place, they don\'t immediately hand you a pizza — they give you an order ticket (a Promise). If you try to eat the ticket instead of waiting for the pizza to arrive, you\'ll be very disappointed. `await` is the act of waiting at the door until the pizza actually arrives.',
        explanation: 'In JavaScript, some operations take time — like fetching data from a server. These operations return a Promise: a placeholder that says "I\'ll have your answer soon." If you forget to `await` the Promise, you receive the placeholder, not the actual answer. Always use `await` when calling an `async` function if you need its return value.',
        rule: 'If a function is declared `async`, calling it without `await` gives you a Promise, not the value. Always pair async function calls with `await`.',
      },
      intermediate: {
        analogy: 'The JavaScript event loop is single-threaded. `await` is a syntactic checkpoint that suspends the current async function and yields control back to the event loop until the Promise settles. Without it, execution continues synchronously past an unresolved Promise.',
        explanation: 'Every `async` function implicitly wraps its return value in `Promise.resolve()`. Calling such a function without `await` returns the Promise microtask before it has had a chance to resolve. The template literal then serializes the Promise via `.toString()`, yielding "[object Promise]". Adding `await` inserts a microtask checkpoint, pausing the current execution frame until the Promise settles.',
        rule: 'Track the async boundary carefully: any function that calls an async function must itself be async and must await the call if it needs the resolved value. The bug often propagates up the call stack.',
      },
      advanced: {
        analogy: 'This is a common anti-pattern called the "floating Promise" — a Promise that is neither awaited nor `.catch()`-ed, making errors invisible and results inaccessible.',
        explanation: 'Async functions desugar to generator-based state machines. Without `await`, the Promise is created and immediately returned from `fetchUserName`\'s internal microtask queue. The assignee receives the Promise in the pending state (PromiseState: "pending", PromiseResult: undefined). Tools like TypeScript with `@typescript-eslint/no-floating-promises` or ESLint\'s `no-return-await` rule can catch this statically. In Node.js 15+, unhandled Promise rejections throw by default, which can surface related bugs.',
        rule: 'Use `Promise.all()` for concurrent awaits, never fire-and-forget async calls without at least a `.catch()` handler. Consider enabling `@typescript-eslint/no-floating-promises` in CI.',
      },
      quiz: [
        {
          question: 'What does calling an `async` function without `await` return?',
          options: ['The resolved value', 'A Promise object', 'undefined', 'null'],
          correctIndex: 1,
          explanation: 'An `async` function always returns a Promise. Without `await`, you receive the Promise itself — not the value it will eventually resolve to.',
        },
        {
          question: 'What is printed by: `async function f() { return 42; } console.log(f());`',
          options: ['42', 'undefined', 'Promise { 42 }', 'TypeError'],
          correctIndex: 2,
          explanation: 'Without `await`, `f()` returns a Promise. `console.log` prints the Promise object, which displays as `Promise { 42 }` or `Promise { <resolved>: 42 }` depending on the environment.',
        },
        {
          question: 'Which is the correct way to use an async function\'s return value?',
          options: [
            'const val = asyncFn();',
            'const val = await asyncFn();',
            'const val = Promise(asyncFn());',
            'const val = asyncFn().value;',
          ],
          correctIndex: 1,
          explanation: 'Inside another async function, `const val = await asyncFn()` pauses execution until the Promise resolves and assigns the actual resolved value.',
        },
      ],
      practiceChallenge: {
        title: 'Fix the data loader',
        description: 'The function below always logs "Data: [object Promise]". Add the missing keyword to make it work correctly.',
        code: `async function loadData() {
  return { value: 100 };
}

async function display() {
  const data = loadData();   // ← fix this line
  console.log('Data:', data.value);
}

display();  // Should log: Data: 100`,
        hint: 'One word is missing before `loadData()`.',
      },
    },
  },

  // ── CASE 003 ─────────────────────────────────────────────
  {
    id: 'case-003',
    number: '003',
    title: 'The Null Trap',
    tagline: 'A chain that breaks when the link is missing',
    language: 'Java',
    difficulty: 'hard',
    category: 'Null Pointer Exception',

    snippet: `public class UserService {

    public String getUserCity(User user) {
        return user.getAddress().getCity();
    }

    public static void main(String[] args) {
        User user = new User("Alice", null);   // no address
        UserService svc = new UserService();
        System.out.println(svc.getUserCity(user));
    }
}`,

    predict: {
      question: 'What happens when `getUserCity` is called with a user who has no address?',
      options: [
        { id: 'a', text: 'Returns an empty string ""' },
        { id: 'b', text: 'Returns the string "null"' },
        { id: 'c', text: 'Throws a NullPointerException at runtime' },
        { id: 'd', text: 'Returns null silently' },
      ],
      correctId: 'c',
      actualBehavior: 'A NullPointerException is thrown at runtime on the line `user.getAddress().getCity()` because `getAddress()` returns null and then `.getCity()` is called on that null reference.',
    },

    diagnosis: {
      summary: 'A method dereferences a return value that can legitimately be null without checking first, causing a NullPointerException at runtime.',
      rootCause: '`user.getAddress()` returns null when the user has no address. The code immediately chains `.getCity()` on that null reference without any null check, which the JVM cannot execute.',
      confidence: 'high',
      confidenceNote: 'The constructor call explicitly passes null for the address parameter. The exception will always reproduce with this input.',
      evidence: [
        { line: 4, description: '`user.getAddress().getCity()` — two chained method calls with no null guard between them.' },
        { line: 8, description: '`new User("Alice", null)` — the address is explicitly null, guaranteeing `getAddress()` returns null.' },
      ],
      steps: [
        'On line 8, `new User("Alice", null)` creates a user with a null address field.',
        'On line 4, `user.getAddress()` is called first — it returns null.',
        'Java then attempts to call `.getCity()` on the null reference.',
        'The JVM cannot dispatch a method on null. It throws `java.lang.NullPointerException`.',
        'The exception is uncaught, so the program terminates with a stack trace.',
      ],
      otherCauses: [
        'If `getAddress()` returned an Address object whose `getCity()` returns null, no exception would occur — but the caller would silently receive null. This is a separate data quality issue.',
        'In Java 14+, the NullPointerException message is more specific: "Cannot invoke Address.getCity() because getAddress() is null".',
      ],
      nextAction: 'Add a null check before chaining, or use Java\'s Optional type to model the possibility of a missing address.',
    },

    fix: {
      original: `public class UserService {

    public String getUserCity(User user) {
        return user.getAddress().getCity();
    }

    public static void main(String[] args) {
        User user = new User("Alice", null);   // no address
        UserService svc = new UserService();
        System.out.println(svc.getUserCity(user));
    }
}`,
      corrected: `public class UserService {

    public String getUserCity(User user) {
        if (user.getAddress() == null) {
            return "Unknown";
        }
        return user.getAddress().getCity();
    }

    public static void main(String[] args) {
        User user = new User("Alice", null);   // no address
        UserService svc = new UserService();
        System.out.println(svc.getUserCity(user));  // prints: Unknown
    }
}`,
      changedLines: { 4: 'add', 5: 'add', 6: 'add' },
      removedLines: { 4: 'remove' },
      changes: [
        {
          what: 'Added explicit null check before chaining',
          why: 'By checking `user.getAddress() == null` first, we handle the absent-address case gracefully and return a sensible default ("Unknown") rather than crashing.',
        },
      ],
      alternative: `// Modern Java: use Optional
public String getUserCity(User user) {
    return Optional.ofNullable(user.getAddress())
                   .map(Address::getCity)
                   .orElse("Unknown");
}`,
    },

    tests: [
      {
        name: 'Null address triggers NullPointerException (before fix)',
        code: `// Simulate in JS (JVM behaviour equivalent)
function getAddressBuggy(user) {
  return user.address.city;   // no null check — mirrors Java NPE
}

let threw = false;
try {
  getAddressBuggy({ address: null });
} catch (e) {
  threw = true;
}
console.assert(threw === true, 'Should have thrown');
console.log(threw ? 'BEFORE FIX — FAIL: NPE thrown as expected' : 'UNEXPECTED PASS');`,
        expectedResult: 'FAIL',
        note: 'Demonstrates the NPE behaviour before the fix.',
      },
      {
        name: 'Null check returns safe fallback (after fix)',
        code: `function getUserCityFixed(user) {
  if (user.address == null) return 'Unknown';
  return user.address.city;
}

const result = getUserCityFixed({ address: null });
console.assert(result === 'Unknown', 'Should return "Unknown"');
console.log('AFTER FIX — PASS: got "' + result + '"');`,
        expectedResult: 'PASS',
      },
    ],

    lesson: {
      concept: 'Null References & Defensive Programming',
      beginner: {
        analogy: 'Imagine asking someone "What\'s your home address?" and they say "I don\'t have one." If you then immediately ask "What floor do you live on?" without registering their answer, you\'re confused. A null check is simply pausing to ask "do you have an address at all?" before asking about the floor.',
        explanation: 'In Java, `null` means "there is no object here." When you call a method on null — like trying to open a door that doesn\'t exist — Java throws a NullPointerException and your program crashes. The fix is to always check whether an object exists before using it.',
        rule: 'Before calling any method on a reference that might be null, check: `if (ref != null)`. If null is a valid state, handle it with a sensible default.',
      },
      intermediate: {
        analogy: 'NullPointerException is sometimes called the "Billion Dollar Mistake" — a phrase coined by Tony Hoare, who invented the null reference in 1965 and later apologized for it. Modern languages replace null with Optional/Maybe types that force you to handle the absent case.',
        explanation: 'Java references are pointers. A null reference is a pointer to address 0x0. The JVM\'s method dispatch reads the vtable at the object\'s memory address; when the address is null, this produces a segfault that Java surfaces as NullPointerException. Java 8\'s `Optional<T>` makes the possibility of absence explicit in the type system, preventing the call-site from ignoring it.',
        rule: 'Use `Optional` when absence is a valid part of your domain model. Reserve null for internal/private state where you control all access points.',
      },
      advanced: {
        analogy: 'The NPE is an instance of the more general problem of "billion-dollar mistake" null references. Kotlin addresses this with nullable types (String?) that require explicit null handling. Java\'s Optional is a value-based approach that doesn\'t solve all cases but makes the contract explicit.',
        explanation: 'At the bytecode level, `user.getAddress().getCity()` compiles to two `invokevirtual` instructions with no interleaved null check. The JVM verifier allows this — null checks are the programmer\'s responsibility in Java. Java 14+ Helpful NPEs (JEP 358) improve the diagnostic message. The Optional approach uses `flatMap`/`map` to sequence nullable transformations monadically, making the absence case structurally unignorable.',
        rule: 'Model absence with Optional, use @NonNull/@Nullable annotations at API boundaries, and enable static null-analysis via tools like NullAway or IntelliJ\'s nullability checks in CI.',
      },
      quiz: [
        {
          question: 'What exception does Java throw when you call a method on a null reference?',
          options: ['IllegalArgumentException', 'NullPointerException', 'NoSuchMethodException', 'RuntimeException'],
          correctIndex: 1,
          explanation: 'Java throws `java.lang.NullPointerException` (NPE) when you try to call a method or access a field on a null reference. It is an unchecked RuntimeException.',
        },
        {
          question: 'Which Java 8+ API makes absence of a value explicit in the return type?',
          options: ['Nullable<T>', 'Optional<T>', 'Maybe<T>', 'Either<T>'],
          correctIndex: 1,
          explanation: '`java.util.Optional<T>` is a container that either holds a value or is empty. Using it as a return type signals to callers that the value may be absent, forcing them to handle that case.',
        },
        {
          question: 'Which check correctly prevents an NPE before calling `getCity()`?',
          options: [
            'if (user != null) return user.getAddress().getCity();',
            'if (user.getAddress() != null) return user.getAddress().getCity();',
            'try { return user.getAddress().getCity(); } finally {}',
            'return user.getAddress()?.getCity();',
          ],
          correctIndex: 1,
          explanation: 'The NPE occurs because `getAddress()` returns null. We must check *that specific return value* before calling `.getCity()` on it. Checking `user != null` doesn\'t help if the address itself is null. (Note: the `?.` optional chaining operator is Kotlin syntax, not Java.)',
        },
      ],
      practiceChallenge: {
        title: 'Safe order total',
        description: 'The method below crashes when an order has no discount object. Add a null check to return the full price when there is no discount.',
        code: `public double getFinalPrice(Order order) {
    double base = order.getBasePrice();
    double discount = order.getDiscount().getAmount();  // NPE if no discount
    return base - discount;
}`,
        hint: 'Check whether `order.getDiscount()` is null before calling `.getAmount()` on it. Return `base` (full price) when there is no discount.',
      },
    },
  },
];

export function getCaseById(id) {
  return CASES.find(c => c.id === id) || null;
}
