// ==============================================================================
// COMPUTATIONAL CREATIVITY VISUALIZERS (Theme 06)
// Interactive Visual Metaphors: Russian Dolls, Lockers, Phonebook
// ==============================================================================

class VisualMetaphorEngine {
  constructor(containerId) {
    this.containerId = containerId;
    this.currentMetaphor = null;
    this.state = {};
  }

  render(metaphorType, containerElement, customData = {}) {
    if (!containerElement) return;

    if (metaphorType === 'recursion_dolls') {
      this.renderRecursionDolls(containerElement, customData);
    } else if (metaphorType === 'array_lockers') {
      this.renderArrayLockers(containerElement, customData);
    } else if (metaphorType === 'binary_search') {
      this.renderBinarySearch(containerElement, customData);
    } else {
      this.renderGeneralConveyor(containerElement, customData);
    }
  }

  // 1. RECURSION VISUALIZER: Russian Nesting Dolls
  renderRecursionDolls(el, data) {
    let currentDepth = data.depth !== undefined ? data.depth : 1;
    const maxDepth = 4;
    const callStack = ["factorial(4)", "factorial(3)", "factorial(2)", "factorial(1) [BASE CASE]"];

    const updateView = (depth) => {
      currentDepth = depth;
      el.innerHTML = `
        <div class="p-4 bg-slate-900 border border-indigo-500/40 rounded-xl text-white shadow-xl">
          <div class="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
            <div class="flex items-center gap-2">
              <span class="text-2xl">🪆</span>
              <div>
                <h4 class="font-bold text-sm text-indigo-300">Theme 06 Metaphor: Russian Nesting Dolls</h4>
                <p class="text-xs text-slate-400">Concept: The Call Stack & Stopping Condition (Base Case)</p>
              </div>
            </div>
            <span class="px-2 py-0.5 text-xs rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700">
              Depth: Level ${currentDepth} of ${maxDepth}
            </span>
          </div>

          <!-- Interactive Dolls Display -->
          <div class="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-lg min-h-[170px] relative overflow-hidden">
            <div class="flex items-end justify-center gap-4 transition-all duration-300">
              ${[4, 3, 2, 1].map((lvl, idx) => {
                const isOpen = lvl >= 5 - currentDepth;
                const isBase = lvl === 1;
                const scale = 0.6 + (lvl * 0.15);
                const isCurrent = (5 - currentDepth) === lvl;

                return `
                  <div class="flex flex-col items-center transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-25 grayscale'}">
                    <div style="transform: scale(${scale});" class="relative group cursor-pointer transition-transform">
                      <div class="w-16 h-20 rounded-t-full rounded-b-2xl flex flex-col items-center justify-center shadow-lg border-2 ${
                        isBase 
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 border-emerald-300' 
                          : 'bg-gradient-to-t from-orange-600 to-amber-400 border-amber-300'
                      } ${isCurrent ? 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-slate-900 animate-pulse' : ''}">
                        <div class="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-xs shadow-inner mb-1">
                          ${isBase ? '👶' : '👩'}
                        </div>
                        <span class="text-[11px] font-black text-slate-950 px-1 py-0.5 rounded bg-white/70">n=${lvl}</span>
                      </div>
                    </div>
                    <span class="text-[11px] font-mono mt-2 ${isCurrent ? 'text-cyan-300 font-bold' : 'text-slate-400'}">
                      ${callStack[idx]}
                    </span>
                  </div>
                `;
              }).join('')}
            </div>

            ${currentDepth === 4 ? `
              <div class="mt-4 px-3 py-1.5 bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs rounded-lg text-center animate-bounce">
                🎉 <strong>BASE CASE REACHED (n=1)!</strong> Doll cannot open further. Now values multiply backwards: 1 × 2 × 3 × 4 = 24!
              </div>
            ` : ''}
          </div>

          <!-- Call Stack Steps & Controls -->
          <div class="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
            <div class="text-xs text-slate-300">
              <span class="text-slate-400">Current Action:</span>
              <code class="text-cyan-300 font-mono ml-1">${currentDepth < 4 ? `Call factorial(${5 - currentDepth - 1})` : 'Unwind Stack & Return 24'}</code>
            </div>
            <div class="flex gap-2">
              <button id="btn-doll-back" class="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition ${currentDepth <= 1 ? 'opacity-50 cursor-not-allowed' : ''}">
                ⬅️ Step Out
              </button>
              <button id="btn-doll-next" class="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded shadow transition ${currentDepth >= 4 ? 'opacity-50 cursor-not-allowed' : ''}">
                Step Inside 🪆
              </button>
            </div>
          </div>
        </div>
      `;

      el.querySelector('#btn-doll-next')?.addEventListener('click', () => {
        if (currentDepth < 4) updateView(currentDepth + 1);
      });
      el.querySelector('#btn-doll-back')?.addEventListener('click', () => {
        if (currentDepth > 1) updateView(currentDepth - 1);
      });
    };

    updateView(currentDepth);
  }

  // 2. ARRAY POINTERS: School Hallway Lockers
  renderArrayLockers(el, data) {
    const lockers = [2, 7, 11, 15];
    const target = 9;
    let left = 0;
    let right = 3;

    const updateView = () => {
      const currentSum = lockers[left] + lockers[right];
      const isMatch = currentSum === target;

      el.innerHTML = `
        <div class="p-4 bg-slate-900 border border-amber-500/40 rounded-xl text-white shadow-xl">
          <div class="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
            <div class="flex items-center gap-2">
              <span class="text-2xl">🏫</span>
              <div>
                <h4 class="font-bold text-sm text-amber-300">Theme 06 Metaphor: School Lockers</h4>
                <p class="text-xs text-slate-400">Concept: Two-Pointer Traversal with Sorted Memory</p>
              </div>
            </div>
            <span class="px-2 py-0.5 text-xs rounded-full bg-amber-950 text-amber-300 border border-amber-700">
              Target Sum = ${target}
            </span>
          </div>

          <!-- Lockers Display -->
          <div class="grid grid-cols-4 gap-3 p-4 bg-slate-950 rounded-lg">
            ${lockers.map((val, idx) => {
              const isLeft = idx === left;
              const isRight = idx === right;
              const isBoth = isLeft && isRight;

              return `
                <div class="flex flex-col items-center">
                  <div class="w-full h-24 bg-gradient-to-b from-slate-800 to-slate-900 border-2 ${
                    isMatch && (isLeft || isRight) 
                      ? 'border-emerald-400 ring-2 ring-emerald-400 bg-emerald-950/40' 
                      : (isLeft || isRight) 
                        ? 'border-cyan-400 ring-2 ring-cyan-400/50' 
                        : 'border-slate-700'
                  } rounded-lg flex flex-col justify-between p-2 shadow-inner relative transition-all">
                    <div class="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-1">
                      <span>Locker</span>
                      <span class="font-mono font-bold text-white">#${idx}</span>
                    </div>
                    <div class="text-xl font-bold font-mono text-center text-amber-200">
                      ${val}
                    </div>
                    <div class="h-2 w-2 rounded-full bg-slate-600 mx-auto"></div>
                  </div>

                  <!-- Pointer indicators -->
                  <div class="mt-2 text-center h-8">
                    ${isLeft ? '<span class="px-1.5 py-0.5 bg-cyan-600 text-[10px] font-bold rounded text-white shadow">LEFT (i)</span>' : ''}
                    ${isRight ? '<span class="px-1.5 py-0.5 bg-orange-600 text-[10px] font-bold rounded text-white shadow ml-1">RIGHT (j)</span>' : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Math Feedback -->
          <div class="mt-3 p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs">
            <div>
              <span class="text-slate-400">Current Sum:</span>
              <code class="font-mono text-cyan-300 font-bold ml-1">${lockers[left]} + ${lockers[right]} = ${currentSum}</code>
              ${currentSum > target ? '<span class="text-red-400 ml-2 font-semibold">(Too Big! Shift Right Left)</span>' : ''}
              ${currentSum < target ? '<span class="text-yellow-400 ml-2 font-semibold">(Too Small! Shift Left Right)</span>' : ''}
              ${isMatch ? '<span class="text-emerald-400 ml-2 font-bold animate-pulse">🎉 MATCH FOUND! [indices '+left+', '+right+']</span>' : ''}
            </div>
            <div class="flex gap-2">
              <button id="btn-shift-left" class="px-2 py-1 bg-cyan-700 hover:bg-cyan-600 rounded text-xs text-white" ${left >= right - 1 ? 'disabled' : ''}>
                Left +1 ➡️
              </button>
              <button id="btn-shift-right" class="px-2 py-1 bg-orange-700 hover:bg-orange-600 rounded text-xs text-white" ${right <= left + 1 ? 'disabled' : ''}>
                ⬅️ Right -1
              </button>
              <button id="btn-reset-ptr" class="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300">
                Reset
              </button>
            </div>
          </div>
        </div>
      `;

      el.querySelector('#btn-shift-left')?.addEventListener('click', () => {
        if (left < right) { left++; updateView(); }
      });
      el.querySelector('#btn-shift-right')?.addEventListener('click', () => {
        if (right > left) { right--; updateView(); }
      });
      el.querySelector('#btn-reset-ptr')?.addEventListener('click', () => {
        left = 0; right = 3; updateView();
      });
    };

    updateView();
  }

  // 3. BINARY SEARCH: Phonebook Halving
  renderBinarySearch(el) {
    const list = [3, 8, 14, 20, 27, 35, 42];
    const target = 35;
    let low = 0;
    let high = 6;
    let stepCount = 0;

    const updateView = () => {
      const mid = Math.floor((low + high) / 2);
      const midVal = list[mid];
      const isFound = midVal === target;

      el.innerHTML = `
        <div class="p-4 bg-slate-900 border border-cyan-500/40 rounded-xl text-white shadow-xl">
          <div class="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
            <div class="flex items-center gap-2">
              <span class="text-2xl">📖</span>
              <div>
                <h4 class="font-bold text-sm text-cyan-300">Theme 06 Metaphor: The Phonebook Ripping Trick</h4>
                <p class="text-xs text-slate-400">Concept: Divide & Conquer — Tossing Half the Pages Every Step</p>
              </div>
            </div>
            <span class="px-2 py-0.5 text-xs rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700">
              Searching for: ${target}
            </span>
          </div>

          <!-- Pages in Array -->
          <div class="grid grid-cols-7 gap-1.5 p-3 bg-slate-950 rounded-lg">
            ${list.map((num, idx) => {
              const isExcluded = idx < low || idx > high;
              const isMid = idx === mid && !isExcluded;
              const isTargetFound = isMid && isFound;

              return `
                <div class="flex flex-col items-center">
                  <div class="w-full h-18 rounded flex flex-col items-center justify-center p-1 border transition-all ${
                    isTargetFound 
                      ? 'bg-emerald-600 border-emerald-300 text-white scale-110 shadow-lg ring-2 ring-emerald-400 animate-pulse'
                      : isMid 
                        ? 'bg-amber-600 border-amber-300 text-white font-bold'
                        : isExcluded 
                          ? 'bg-slate-900 border-slate-800 text-slate-600 opacity-30 line-through'
                          : 'bg-slate-800 border-slate-600 text-cyan-200'
                  }">
                    <span class="text-[9px] text-slate-400">p.${idx}</span>
                    <span class="text-base font-bold font-mono">${num}</span>
                  </div>
                  <div class="text-[9px] mt-1 font-mono">
                    ${idx === low && !isExcluded ? '<span class="text-cyan-400 font-bold">LOW</span>' : ''}
                    ${isMid ? '<span class="text-amber-400 font-bold">MID</span>' : ''}
                    ${idx === high && !isExcluded ? '<span class="text-purple-400 font-bold">HIGH</span>' : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Step Info & Action -->
          <div class="mt-3 p-3 bg-slate-800/60 rounded-lg flex items-center justify-between text-xs">
            <div>
              <span class="text-slate-400">Middle Element:</span>
              <code class="font-mono text-amber-300 font-bold ml-1">arr[${mid}] = ${midVal}</code>
              ${midVal < target ? '<span class="text-cyan-300 ml-2 font-medium">(${midVal} < ${target} -> Discard left half!)</span>' : ''}
              ${midVal > target ? '<span class="text-purple-300 ml-2 font-medium">(${midVal} > ${target} -> Discard right half!)</span>' : ''}
              ${isFound ? '<span class="text-emerald-400 ml-2 font-bold">🎉 TARGET DISCOVERED IN '+stepCount+' STEPS!</span>' : ''}
            </div>
            <div class="flex gap-2">
              <button id="btn-next-halve" class="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded text-xs shadow" ${isFound ? 'disabled' : ''}>
                Rip & Halve ✂️
              </button>
              <button id="btn-reset-bin" class="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs">
                Reset
              </button>
            </div>
          </div>
        </div>
      `;

      el.querySelector('#btn-next-halve')?.addEventListener('click', () => {
        if (midVal < target) {
          low = mid + 1;
        } else if (midVal > target) {
          high = mid - 1;
        }
        stepCount++;
        updateView();
      });

      el.querySelector('#btn-reset-bin')?.addEventListener('click', () => {
        low = 0; high = 6; stepCount = 0; updateView();
      });
    };

    updateView();
  }

  // 4. GENERAL CONVEYOR / STEM
  renderGeneralConveyor(el) {
    el.innerHTML = `
      <div class="p-4 bg-slate-900 border border-purple-500/40 rounded-xl text-white shadow-xl">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl">⚙️</span>
          <div>
            <h4 class="font-bold text-sm text-purple-300">Theme 06 Metaphor: The Assembly Conveyor</h4>
            <p class="text-xs text-slate-400">Concept: Transform Data Step-by-Step Instead of All at Once</p>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-2 p-3 bg-slate-950 rounded-lg text-center text-xs">
          <div class="p-3 bg-slate-800 rounded border border-slate-700">
            <span class="text-cyan-400 font-bold block mb-1">1. Ingest Data</span>
            <p class="text-[11px] text-slate-400">Read matrix rows and target vector</p>
          </div>
          <div class="p-3 bg-slate-800 rounded border border-purple-500/50">
            <span class="text-purple-400 font-bold block mb-1">2. Dot Product</span>
            <p class="text-[11px] text-slate-400">Multiply corresponding pairs and sum</p>
          </div>
          <div class="p-3 bg-slate-800 rounded border border-slate-700">
            <span class="text-emerald-400 font-bold block mb-1">3. Pack Vector</span>
            <p class="text-[11px] text-slate-400">Return combined transformed coordinates</p>
          </div>
        </div>
      </div>
    `;
  }
}

window.VisualMetaphorEngine = VisualMetaphorEngine;

