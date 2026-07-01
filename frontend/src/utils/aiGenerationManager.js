import { generateIdeas } from '../api/ai';
import toast from 'react-hot-toast';

class AIGenerationManager {
  constructor() {
    this.listeners = new Set();
    this.activeGenerations = {}; // clientId -> boolean
    this.ideas = this.loadFromStorage(); // clientId -> array of ideas
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem('cadence_pending_ai_ideas');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('cadence_pending_ai_ideas', JSON.stringify(this.ideas));
    } catch (err) {
      console.error('Error saving pending AI ideas to localStorage:', err);
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(listener => listener());
  }

  isGenerating(clientId) {
    return Boolean(this.activeGenerations[clientId]);
  }

  getIdeas(clientId) {
    return this.ideas[clientId] || [];
  }

  setIdeas(clientId, newIdeas) {
    if (!newIdeas || newIdeas.length === 0) {
      delete this.ideas[clientId];
    } else {
      this.ideas[clientId] = newIdeas;
    }
    this.saveToStorage();
    this.notify();
  }

  clearIdeas(clientId) {
    delete this.ideas[clientId];
    this.saveToStorage();
    this.notify();
  }

  async triggerGeneration(clientId, {
    topic,
    quantity,
    monthContext,
    chosenDates,
    monthDate,
    allowNextMonth,
    overflowsCurrentMonth,
    clientName
  }) {
    if (this.activeGenerations[clientId]) return;

    this.activeGenerations[clientId] = true;
    this.notify();

    const displayClientName = clientName || 'el cliente';
    toast.success(`Generando ideas en segundo plano para ${displayClientName}...`, { duration: 4000 });

    try {
      const parsedConcepts = topic.trim()
        ? topic
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
        : [];

      const activeTopic = topic.trim() || 'Ideas de contenido variadas, generales y creativas para redes sociales.';

      const response = await generateIdeas(clientId, {
        userPrompt: `${activeTopic}. Genera ${quantity} piezas para ${monthContext[0] || 'el mes'}.`,
        monthContext,
        quantity,
        concepts: parsedConcepts.length > 1 ? parsedConcepts : undefined,
      });

      const nextIdeas = Array.isArray(response) ? response.slice(0, quantity) : [];
      if (!nextIdeas.length) {
        throw new Error('La IA no devolvió ideas.');
      }

      const shuffled = values => {
        const result = [...values];
        for (let index = result.length - 1; index > 0; index -= 1) {
          const randomIndex = Math.floor(Math.random() * (index + 1));
          [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
        }
        return result;
      };

      const parseDateInput = value => {
        const dateText = String(value || '').slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return null;
        const parsed = new Date(`${dateText}T12:00:00`);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      };

      const toDateInputValue = date => {
        const d = new Date(date);
        if (Number.isNaN(d.getTime())) return '';
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };

      const buildMonthDatePool = (refDate, includeNextMonth = false) => {
        const now = new Date();
        const refObj = new Date(refDate);
        const monthStart = new Date(refObj.getFullYear(), refObj.getMonth(), 1);
        const monthEnd = new Date(refObj.getFullYear(), refObj.getMonth() + 1, 0);
        
        const isSameMonth = now.getFullYear() === refObj.getFullYear() && now.getMonth() === refObj.getMonth();
        const firstDay = isSameMonth
          ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
          : monthStart;
        const safeStart = firstDay > monthEnd ? monthStart : firstDay;
        const dates = [];

        for (let cursor = new Date(safeStart); cursor <= monthEnd; cursor.setDate(cursor.getDate() + 1)) {
          dates.push(toDateInputValue(cursor));
        }

        if (includeNextMonth) {
          const nextMonthEnd = new Date(refObj.getFullYear(), refObj.getMonth() + 2, 0);
          for (
            let cursor = new Date(refObj.getFullYear(), refObj.getMonth() + 1, 1);
            cursor <= nextMonthEnd;
            cursor.setDate(cursor.getDate() + 1)
          ) {
            dates.push(toDateInputValue(cursor));
          }
        }

        return dates;
      };

      const assignDatesToIdeas = ({ ideasList, requestedDates, monthDateVal, includeNext }) => {
        const validRequestedDates = requestedDates
          .map(parseDateInput)
          .filter(Boolean)
          .map(toDateInputValue);
        const requestedSet = new Set(validRequestedDates);
        const pool = shuffled(
          buildMonthDatePool(monthDateVal, includeNext).filter(date => !requestedSet.has(date))
        );
        let poolIndex = 0;

        return ideasList.map((idea, index) => {
          const assignedDate =
            validRequestedDates[index] || pool[poolIndex++] || toDateInputValue(monthDateVal);
          return {
            ...idea,
            scheduled_at: assignedDate,
            _dateWasChosen: Boolean(validRequestedDates[index]),
          };
        });
      };

      const ideasWithDates = assignDatesToIdeas({
        ideasList: nextIdeas,
        requestedDates: chosenDates || [],
        monthDateVal: monthDate,
        includeNext: allowNextMonth || overflowsCurrentMonth,
      });

      this.ideas[clientId] = ideasWithDates;
      this.saveToStorage();

      toast.success(`¡Generación completa! Aura preparó ${ideasWithDates.length} ideas para ${displayClientName}.`, {
        duration: 5000,
        icon: '💡'
      });
    } catch (error) {
      console.error('Error generating ideas in background:', error);
      toast.error(`No se pudieron generar ideas para ${displayClientName}: ${error.message || 'Error del servidor'}`);
    } finally {
      this.activeGenerations[clientId] = false;
      this.notify();
    }
  }
}

export const aiGenerationManager = new AIGenerationManager();
