/* global window, document */
(function () {
  "use strict";

  var STORAGE_KEY = "kanban-board-v1";
  var columns = [
    { id: "queue", title: "Queue", wipLimit: 8 },
    { id: "working", title: "Working", wipLimit: 4 },
    { id: "bugs", title: "Bugs", wipLimit: 6 },
    { id: "done", title: "Done", wipLimit: null }
  ];

  var seedCards = [
    { id: "seed-1", columnId: "done", title: "DRY templates and shared partials cleanup.", type: "Task", priority: "High", owner: "", due: "" },
    { id: "seed-2", columnId: "done", title: "Refactor kanban/search CSS into shared tokens.", type: "Task", priority: "Med", owner: "", due: "" },
    { id: "seed-3", columnId: "done", title: "Standardize front matter defaults and descriptions.", type: "Task", priority: "Med", owner: "", due: "" },
    { id: "seed-4", columnId: "queue", title: "Confirm admin board copy and placeholder text.", type: "Task", priority: "Low", owner: "", due: "" },
    { id: "seed-5", columnId: "queue", title: "Triage any expected 404s in project links.", type: "Task", priority: "Low", owner: "", due: "" },
    { id: "seed-6", columnId: "bugs", title: "Broken image in Amtrak post (expected for now).", type: "Bug", priority: "Low", owner: "", due: "" },
    { id: "seed-7", columnId: "done", title: "Sync kanban seed data with current work.", type: "Task", priority: "High", owner: "", due: "" },
    { id: "seed-8", columnId: "done", title: "Contact link corrected to /contact/.", type: "Bug", priority: "Med", owner: "", due: "" },
    { id: "seed-9", columnId: "done", title: "Search index generation fixed.", type: "Bug", priority: "High", owner: "", due: "" }
  ];

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function normalizeCard(card) {
    var next = {
      id: card.id,
      columnId: card.columnId || "queue",
      title: card.title || "",
      type: card.type || "Task",
      priority: card.priority || "Med",
      owner: card.owner || "",
      due: card.due || ""
    };
    var validColumn = columns.some(function (column) {
      return column.id === next.columnId;
    });
    if (!validColumn) {
      next.columnId = "queue";
    }
    return next;
  }

  function migrateBoard(board) {
    var next = {
      cards: (board.cards || []).map(normalizeCard)
    };
    return next;
  }

  function loadBoard() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.cards)) {
          return migrateBoard(parsed);
        }
      }
    } catch (error) {
      // Ignore storage errors and fall back to seed data.
    }
    return {
      cards: seedCards.slice().map(normalizeCard)
    };
  }

  function saveBoard(board) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
    } catch (error) {
      // Ignore storage errors.
    }
  }

  function resetBoard() {
    var next = { cards: seedCards.slice() };
    saveBoard(next);
    return next;
  }

  function getFilters() {
    var typeSelect = $("[data-kanban-filter-type]");
    var prioritySelect = $("[data-kanban-filter-priority]");
    return {
      type: typeSelect ? typeSelect.value : "all",
      priority: prioritySelect ? prioritySelect.value : "all"
    };
  }

  function applyFilters(cards, filters) {
    return cards.filter(function (card) {
      var typeMatch = filters.type === "all" || card.type === filters.type;
      var priorityMatch = filters.priority === "all" || card.priority === filters.priority;
      return typeMatch && priorityMatch;
    });
  }

  function buildColumn(column, board, filters) {
    var wrapper = document.createElement("section");
    wrapper.className = "kanban-column";
    wrapper.dataset.columnId = column.id;

    var header = document.createElement("div");
    header.className = "kanban-column-header";

    var title = document.createElement("h2");
    title.className = "kanban-column-title";
    title.textContent = column.title;

    var count = document.createElement("span");
    count.className = "kanban-column-count";
    count.textContent = "0";

    header.appendChild(title);
    header.appendChild(count);

    var list = document.createElement("div");
    list.className = "kanban-list";
    list.dataset.columnId = column.id;

    var form = document.createElement("form");
    form.className = "kanban-add";
    form.dataset.columnId = column.id;
    form.innerHTML = '<input type="text" placeholder="Add card..." aria-label="Add card">' +
      '<button type="submit">Add</button>';

    wrapper.appendChild(header);
    wrapper.appendChild(list);
    wrapper.appendChild(form);

    renderCardsInto(list, count, column, board.cards, filters);
    return wrapper;
  }

  function renderCardsInto(list, countEl, column, cards, filters) {
    list.innerHTML = "";
    var columnCards = cards.filter(function (card) {
      return card.columnId === column.id;
    });
    var visibleCards = applyFilters(columnCards, filters);

    visibleCards.forEach(function (card) {
      list.appendChild(buildCard(card));
    });
    var countText = String(visibleCards.length);
    if (column.wipLimit) {
      countText += " / " + column.wipLimit;
    }
    countEl.textContent = countText;
  }

  function buildCard(card) {
    var item = document.createElement("article");
    item.className = "kanban-card" + (card.type === "Bug" ? " kanban-card--bug" : "");
    item.draggable = true;
    item.dataset.cardId = card.id;

    var title = document.createElement("p");
    title.className = "kanban-card-title";
    title.textContent = card.title;
    title.setAttribute("title", card.title);

    var meta = document.createElement("div");
    meta.className = "kanban-card-meta";
    meta.innerHTML = "<span><strong>Type:</strong> " + card.type + "</span>" +
      "<span><strong>Priority:</strong> " + card.priority + "</span>" +
      (card.owner ? "<span><strong>Owner:</strong> " + card.owner + "</span>" : "") +
      (card.due ? "<span><strong>Due:</strong> " + card.due + "</span>" : "");

    var actions = document.createElement("div");
    actions.className = "kanban-card-actions";

    var edit = document.createElement("button");
    edit.className = "kanban-card-edit";
    edit.type = "button";
    edit.textContent = "Edit";
    edit.setAttribute("aria-label", "Edit card");

    var del = document.createElement("button");
    del.className = "kanban-card-delete";
    del.type = "button";
    del.textContent = "Delete";
    del.setAttribute("aria-label", "Delete card");

    actions.appendChild(edit);
    actions.appendChild(del);
    item.appendChild(title);
    item.appendChild(meta);
    item.appendChild(actions);
    return item;
  }

  function renderBoard(board) {
    var boardEl = $("[data-kanban-board]");
    if (!boardEl) {
      return;
    }
    boardEl.innerHTML = "";
    var filters = getFilters();
    columns.forEach(function (column) {
      boardEl.appendChild(buildColumn(column, board, filters));
    });
  }

  function getCardById(cards, id) {
    for (var i = 0; i < cards.length; i += 1) {
      if (cards[i].id === id) {
        return cards[i];
      }
    }
    return null;
  }

  function handleDragStart(event) {
    var card = event.target.closest(".kanban-card");
    if (!card) {
      return;
    }
    card.classList.add("is-dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", card.dataset.cardId);
  }

  function handleDragEnd(event) {
    var card = event.target.closest(".kanban-card");
    if (card) {
      card.classList.remove("is-dragging");
    }
  }

  function handleDragOver(event) {
    var list = event.target.closest(".kanban-list");
    if (!list) {
      return;
    }
    event.preventDefault();
    list.classList.add("is-dragover");
    event.dataTransfer.dropEffect = "move";
  }

  function handleDragLeave(event) {
    var list = event.target.closest(".kanban-list");
    if (!list) {
      return;
    }
    list.classList.remove("is-dragover");
  }

  function handleDrop(event, board) {
    var list = event.target.closest(".kanban-list");
    if (!list) {
      return;
    }
    event.preventDefault();
    list.classList.remove("is-dragover");
    var cardId = event.dataTransfer.getData("text/plain");
    var card = getCardById(board.cards, cardId);
    if (!card) {
      return;
    }
    card.columnId = list.dataset.columnId;
    saveBoard(board);
    renderBoard(board);
  }

  function handleAddCard(event, board) {
    var form = event.target.closest(".kanban-add");
    if (!form) {
      return;
    }
    event.preventDefault();
    var input = form.querySelector("input");
    var title = input.value.trim();
    if (!title) {
      return;
    }
    var cardId = "card-" + Date.now();
    board.cards.push({
      id: cardId,
      columnId: form.dataset.columnId,
      title: title,
      type: "Task",
      priority: "Med",
      owner: "",
      due: ""
    });
    input.value = "";
    saveBoard(board);
    renderBoard(board);
  }

  function handleQuickAdd(event, board) {
    var form = event.target.closest("[data-kanban-quick-add]");
    if (!form) {
      return;
    }
    event.preventDefault();
    var title = (form.elements.title && form.elements.title.value || "").trim();
    if (!title) {
      return;
    }
    var cardId = "card-" + Date.now();
    board.cards.push({
      id: cardId,
      columnId: form.elements.column.value || "queue",
      title: title,
      type: form.elements.type.value || "Task",
      priority: form.elements.priority.value || "Med",
      owner: form.elements.owner.value || "",
      due: form.elements.due.value || ""
    });
    form.reset();
    saveBoard(board);
    renderBoard(board);
  }

  function handleDeleteCard(event, board) {
    if (!event.target.closest(".kanban-card-delete")) {
      return;
    }
    var card = event.target.closest(".kanban-card");
    if (!card) {
      return;
    }
    board.cards = board.cards.filter(function (item) {
      return item.id !== card.dataset.cardId;
    });
    saveBoard(board);
    renderBoard(board);
  }

  function buildEditForm(card) {
    var form = document.createElement("form");
    form.className = "kanban-card-edit-form";
    form.innerHTML =
      '<label>Title<input name="title" type="text" required></label>' +
      '<label>Type<select name="type">' +
      '<option value="Task">Task</option>' +
      '<option value="Feature">Feature</option>' +
      '<option value="Bug">Bug</option>' +
      '</select></label>' +
      '<label>Priority<select name="priority">' +
      '<option value="High">High</option>' +
      '<option value="Med">Med</option>' +
      '<option value="Low">Low</option>' +
      '</select></label>' +
      '<label>Owner<input name="owner" type="text"></label>' +
      '<label>Due<input name="due" type="date"></label>' +
      '<div class="kanban-card-edit-actions">' +
      '<button type="submit">Save</button>' +
      '<button type="button" data-kanban-edit-cancel>Cancel</button>' +
      '</div>';

    form.elements.title.value = card.title || "";
    form.elements.type.value = card.type || "Task";
    form.elements.priority.value = card.priority || "Med";
    form.elements.owner.value = card.owner || "";
    form.elements.due.value = card.due || "";
    return form;
  }

  function enterEditMode(cardEl, cardData) {
    cardEl.classList.add("is-editing");
    cardEl.innerHTML = "";
    cardEl.appendChild(buildEditForm(cardData));
  }

  function handleEditCard(event, board) {
    var editButton = event.target.closest(".kanban-card-edit");
    if (!editButton) {
      return;
    }
    var cardEl = editButton.closest(".kanban-card");
    if (!cardEl) {
      return;
    }
    var cardData = getCardById(board.cards, cardEl.dataset.cardId);
    if (!cardData) {
      return;
    }
    enterEditMode(cardEl, cardData);
  }

  function handleEditSubmit(event, board) {
    var form = event.target.closest(".kanban-card-edit-form");
    if (!form) {
      return;
    }
    event.preventDefault();
    var cardEl = form.closest(".kanban-card");
    if (!cardEl) {
      return;
    }
    var cardData = getCardById(board.cards, cardEl.dataset.cardId);
    if (!cardData) {
      return;
    }
    var title = form.elements.title.value.trim();
    if (!title) {
      return;
    }
    cardData.title = title;
    cardData.type = form.elements.type.value;
    cardData.priority = form.elements.priority.value;
    cardData.owner = form.elements.owner.value.trim();
    cardData.due = form.elements.due.value;
    saveBoard(board);
    renderBoard(board);
  }

  function handleEditCancel(event, board) {
    if (!event.target.closest("[data-kanban-edit-cancel]")) {
      return;
    }
    event.preventDefault();
    renderBoard(board);
  }

  function initBoard() {
    var boardEl = $("[data-kanban]");
    if (!boardEl) {
      return;
    }
    var board = loadBoard();
    saveBoard(board);
    renderBoard(board);

    boardEl.addEventListener("dragstart", handleDragStart);
    boardEl.addEventListener("dragend", handleDragEnd);
    boardEl.addEventListener("dragover", handleDragOver);
    boardEl.addEventListener("dragleave", handleDragLeave);
    boardEl.addEventListener("drop", function (event) {
      handleDrop(event, board);
    });
    boardEl.addEventListener("click", function (event) {
      handleEditCard(event, board);
      handleDeleteCard(event, board);
      handleEditCancel(event, board);
    });
    boardEl.addEventListener("submit", function (event) {
      if (event.target.closest(".kanban-card-edit-form")) {
        handleEditSubmit(event, board);
        return;
      }
      if (event.target.closest("[data-kanban-quick-add]")) {
        handleQuickAdd(event, board);
      } else {
        handleAddCard(event, board);
      }
    });

    var filterType = $("[data-kanban-filter-type]");
    var filterPriority = $("[data-kanban-filter-priority]");
    if (filterType) {
      filterType.addEventListener("change", function () {
        renderBoard(board);
      });
    }
    if (filterPriority) {
      filterPriority.addEventListener("change", function () {
        renderBoard(board);
      });
    }

    var resetButton = $("[data-kanban-reset]");
    if (resetButton) {
      resetButton.addEventListener("click", function () {
        board = resetBoard();
        renderBoard(board);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBoard);
  } else {
    initBoard();
  }
})();
