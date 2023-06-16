import { useEffect, useState } from "react";

import supabase from "./supabase";
import "./style.css";

function App() {
  // 1. Define state variable
  const [showForm, setShowForm] = useState(false);
  const [facts, setFacts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCategory, setCurrentCategory] = useState("all");

  useEffect(
    function () {
      async function getFacts() {
        setIsLoading(true);

        let query = supabase.from("facts").select("*");

        if (currentCategory !== "all")
          query = query.eq("category", currentCategory);

        const { data: facts, error } = await query
          .order("votesInteresting", { ascending: false })
          .limit(1000);

        // setFacts(facts);
        if (!error) setFacts(facts);
        else alert("There is a problem getting data");
        setIsLoading(false);
      }

      getFacts();
    },
    [currentCategory]
  );

  return (
    <>
      <Header showForm={showForm} setShowForm={setShowForm} />

      {/* 2. Use state variable*/}
      {showForm ? (
        <NewFactForm setFacts={setFacts} setShowForm={setShowForm} />
      ) : null}

      <main className="main">
        <CategoryFilter setCurrentCategory={setCurrentCategory} />
        {isLoading ? (
          <Loader />
        ) : (
          <FactList facts={facts} setFacts={setFacts} />
        )}
      </main>
    </>
  );
}

function Loader() {
  return <p className="message">Loading...</p>;
}

function Header({ showForm, setShowForm }) {
  const appTitle = "UFacts";

  return (
    <header className="header">
      <div className="logo">
        <img src="logo.png" height="68" width="68" alt="UFacts" />
        <h1>{appTitle}</h1>
      </div>

      <button
        className="btn btn-large btn-open"
        // 3. Update state variable
        onClick={() => setShowForm((show) => !show)}
      >
        {showForm ? "Close" : "Share a fact"}
      </button>
    </header>
  );
}

const CATEGORIES = [
  { name: "technology", color: "#3b82f6" },
  { name: "science", color: "#16a34a" },
  { name: "finance", color: "#ef4444" },
  { name: "society", color: "#eab308" },
  { name: "entertainment", color: "#db2777" },
  { name: "health", color: "#14b8a6" },
  { name: "history", color: "#f97316" },
  { name: "news", color: "#8b5cf6" },
];

function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
}

function NewFactForm({ setFacts, setShowForm }) {
  const [text, setText] = useState("");
  const [source, setSource] = useState("http://example.com");
  const [category, setCategory] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const textLength = text.length;

  async function handleSubmit(e) {
    // 1.ptevent browser reload
    e.preventDefault();

    // 2.check if data is valid. If so, create a new fact
    if (text && isValidHttpUrl(source) && category && textLength <= 200) {
      // 3. Create a new fact
      // const newFact = {
      //   id: Math.round(Math.random() * 10000),
      //   text,
      //   source,
      //   category,
      //   votesInteresting: 0,
      //   votesMindblowing: 0,
      //   votesFalse: 0,
      //   createdIn: new Date().getFullYear(),
      // };

      // 3. Upload fact to supabase and receive the new fact object
      setIsUploading(true);
      const { data: newFact, error } = await supabase
        .from("facts")
        .insert([{ text, source, category }])
        .select();
      setIsUploading(false);

      // 4. Add the new fact to the UI: add the fact to state
      if (!error) setFacts((facts) => [newFact[0], ...facts]);

      // 5. Reset input fislds
      setText("");
      setSource("");
      setCategory("");

      // 6. Close the form
      setShowForm(false);
    }
  }

  return (
    <form className="fact-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Share a fact with the world..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isUploading}
      />
      <span>{200 - textLength}</span>
      <input
        type="text"
        placeholder="Trustworthy source..."
        value={source}
        onChange={(e) => setSource(e.target.value)}
        disabled={isUploading}
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        disabled={isUploading}
      >
        <option value="">Choose category:</option>

        {CATEGORIES.map((cat) => (
          <option key={cat.name} value={cat.name}>
            {cat.name.toUpperCase()}
          </option>
        ))}
      </select>
      <button className="btn btn-large" disabled={isUploading}>
        Post
      </button>
    </form>
  );
}

function CategoryFilter({ setCurrentCategory }) {
  return (
    <aside>
      <ul>
        <li className="category">
          <button
            className="btn btn-all-categories"
            onClick={() => setCurrentCategory("all")}
          >
            All
          </button>
        </li>

        {CATEGORIES.map((cat) => (
          //<Category category={cat} />

          <li key={cat.name} className="category">
            <button
              className="btn btn-category"
              onClick={() => setCurrentCategory(cat.name)}
              style={{ backgroundColor: cat.color }}
            >
              {cat.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

// function Category({ category }) {
//   return (
//     <li className="category">
//       <button
//         className="btn btn-category"
//         style={{ backgroundColor: category.color }}
//       >
//         {category.name}
//       </button>
//     </li>
//   );
// }

function FactList({ facts, setFacts }) {
  if (!facts.length) {
    <p className="message">
      No facts for this category yet! Create the first one ✌
    </p>;
  }

  return (
    <section>
      <ul className="facts-list">
        {facts.map((fact) => (
          <Fact key={fact.id} fact={fact} setFacts={setFacts} />
        ))}
      </ul>
      <p>There are {facts.length} facts in the databas. Add your own!</p> :
    </section>
  );
}

function Fact({ fact, setFacts }) {
  const [isUpdatng, setIsUpdaing] = useState(false);

  async function handleVote(columnName) {
    setIsUpdaing(true);
    const { data: updatedFact, error } = await supabase
      .from("facts")
      .update({ [columnName]: fact[columnName] + 1 })
      .eq("id", fact.id)
      .select();

    setIsUpdaing(false);

    if (!error)
      setFacts((facts) =>
        facts.map((f) => (f.id === fact.id ? updatedFact[0] : f))
      );
  }

  // if (!error) {
  //   //   const { data: updatedFact, error } = handleVote();
  //   setFacts((facts) =>
  //     facts.map((f) => (f.id === fact.id ? updatedFact[0] : f))
  //   );
  // }
  //const catFound = CATEGORIES.find((cat) => cat.name === fact.category);
  // console.log(catFound, fact.category);
  // console.log(fact);

  return (
    <li className="fact">
      <p>
        {fact.text}

        <a className="source" href={fact.source} target="jsx-no-target-blank">
          (source)
        </a>
      </p>

      <span
        className="tag"
        style={{
          /// === creates error cus find return undefined
          // backgroundColor: CATEGORIES.find((cat) => cat.name === "")
          //         backgroundColor: CATEGORIES.find((cat) => cat.name === fact.category)
          backgroundColor: CATEGORIES.find((cat) => cat.name === fact.category)
            .color,
        }}
      >
        {fact.category}
      </span>

      <div className="vote-buttons">
        <button
          onClick={() => handleVote("votesInteresting")}
          disabled={isUpdatng}
        >
          👍 {fact.votesInteresting}
        </button>
        <button
          onClick={() => handleVote("votesMindblowing")}
          disabled={isUpdatng}
        >
          🤯 {fact.votesMindblowing}
        </button>
        <button onClick={() => handleVote("votesFalse")} disabled={isUpdatng}>
          ⛔️ {fact.votesFalse}
        </button>
      </div>
    </li>
  );
}

export default App;
