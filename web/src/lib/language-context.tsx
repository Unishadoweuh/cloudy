'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'fr';

// Inline translations to avoid dynamic imports during SSR
const translations = {
    en: {
        common: {
            loading: "Loading...",
            error: "Error",
            retry: "Retry",
            save: "Save",
            cancel: "Cancel",
            delete: "Delete",
            create: "Create",
            search: "Search",
            filter: "Filter",
            all: "All",
            clear: "Clear",
            settings: "Settings",
            notifications: "Notifications"
        },
        nav: {
            dashboard: "Dashboard",
            instances: "Instances",
            volumes: "Volumes",
            networks: "Networks",
            security: "Security",
            monitoring: "Monitoring",
            users: "Users",
            settings: "Settings",
            newInstance: "New Instance"
        },
        dashboard: {
            title: "Dashboard",
            welcome: "Welcome to Cloudy",
            quickStats: "Quick Stats",
            quickActions: "Quick Actions",
            systemOnline: "System Online",
            allServicesRunning: "All services running"
        },
        instances: {
            title: "Instances",
            subtitle: "Manage your virtual machines and containers",
            total: "Total Instances",
            running: "Running",
            stopped: "Stopped",
            vcpus: "vCPUs",
            noInstances: "No instances yet",
            noResults: "No matching instances",
            createFirst: "Create your first instance",
            tryDifferent: "Try different filters",
            allTypes: "All Types",
            vmsOnly: "VMs Only",
            lxcOnly: "LXC Only",
            allStatus: "All Status",
            gridView: "Grid View",
            listView: "List View"
        },
        volumes: {
            title: "Storage & Volumes",
            subtitle: "Manage storage pools and disk volumes",
            storagePools: "Storage Pools",
            volumes: "Volumes",
            totalCapacity: "Total Capacity",
            used: "Used",
            allStorage: "All Storage",
            noVolumes: "No volumes found"
        },
        networks: {
            title: "Networks",
            subtitle: "Manage network interfaces and bridges",
            bridges: "Bridges",
            interfaces: "Interfaces",
            totalInterfaces: "Total Interfaces",
            activeBridges: "Active Bridges",
            physicalPorts: "Physical Ports",
            noInterfaces: "No interfaces found",
            allNodes: "All Nodes",
            allTypes: "All Types",
            bridgePorts: "Bridge Ports",
            gateway: "Gateway",
            address: "Address"
        },
        monitoring: {
            title: "Monitoring",
            subtitle: "Real-time infrastructure metrics",
            clusterOverview: "Cluster Overview",
            cpuUsage: "CPU Usage",
            memoryUsage: "Memory Usage",
            diskUsage: "Disk Usage",
            networkTraffic: "Network Traffic",
            totalCores: "Total Cores",
            totalMemory: "Total Memory",
            totalDisk: "Total Disk",
            runningInstances: "Running Instances",
            lastHour: "Last Hour",
            last24h: "Last 24 Hours",
            lastWeek: "Last Week",
            in: "In",
            out: "Out"
        },
        settings: {
            title: "Settings",
            subtitle: "Customize your Cloudy experience",
            language: "Language",
            languageDesc: "Choose your preferred language",
            theme: "Theme",
            themeDesc: "Switch between light and dark mode",
            dark: "Dark",
            light: "Light",
            system: "System",
            saved: "Settings saved"
        },
        security: {
            title: "Security",
            subtitle: "Manage firewall rules and security policies",
            firewallRules: "Firewall Rules",
            addRule: "Add Rule",
            noRules: "No firewall rules found",
            inbound: "Inbound",
            outbound: "Outbound",
            accept: "Accept",
            drop: "Drop",
            reject: "Reject",
            protocol: "Protocol",
            port: "Port",
            source: "Source",
            destination: "Destination",
            enabled: "Enabled",
            disabled: "Disabled",
            cluster: "Cluster",
            allScopes: "All Scopes"
        },
        actions: {
            start: "Start",
            stop: "Stop",
            reset: "Reset",
            shutdown: "Shutdown"
        }
    },
    fr: {
        common: {
            loading: "Chargement...",
            error: "Erreur",
            retry: "Réessayer",
            save: "Enregistrer",
            cancel: "Annuler",
            delete: "Supprimer",
            create: "Créer",
            search: "Rechercher",
            filter: "Filtrer",
            all: "Tout",
            clear: "Effacer",
            settings: "Paramètres",
            notifications: "Notifications"
        },
        nav: {
            dashboard: "Tableau de bord",
            instances: "Instances",
            volumes: "Volumes",
            networks: "Réseaux",
            security: "Sécurité",
            monitoring: "Surveillance",
            users: "Utilisateurs",
            settings: "Paramètres",
            newInstance: "Nouvelle Instance"
        },
        dashboard: {
            title: "Tableau de bord",
            welcome: "Bienvenue sur Cloudy",
            quickStats: "Statistiques rapides",
            quickActions: "Actions rapides",
            systemOnline: "Système en ligne",
            allServicesRunning: "Tous les services fonctionnent"
        },
        instances: {
            title: "Instances",
            subtitle: "Gérez vos machines virtuelles et conteneurs",
            total: "Total Instances",
            running: "En cours",
            stopped: "Arrêtées",
            vcpus: "vCPUs",
            noInstances: "Aucune instance",
            noResults: "Aucune instance trouvée",
            createFirst: "Créez votre première instance",
            tryDifferent: "Essayez d'autres filtres",
            allTypes: "Tous les types",
            vmsOnly: "VMs uniquement",
            lxcOnly: "LXC uniquement",
            allStatus: "Tous les statuts",
            gridView: "Vue grille",
            listView: "Vue liste"
        },
        volumes: {
            title: "Stockage & Volumes",
            subtitle: "Gérez les pools de stockage et les volumes",
            storagePools: "Pools de stockage",
            volumes: "Volumes",
            totalCapacity: "Capacité totale",
            used: "Utilisé",
            allStorage: "Tout le stockage",
            noVolumes: "Aucun volume trouvé"
        },
        networks: {
            title: "Réseaux",
            subtitle: "Gérez les interfaces réseau et les bridges",
            bridges: "Bridges",
            interfaces: "Interfaces",
            totalInterfaces: "Total Interfaces",
            activeBridges: "Bridges Actifs",
            physicalPorts: "Ports Physiques",
            noInterfaces: "Aucune interface trouvée",
            allNodes: "Tous les nœuds",
            allTypes: "Tous les types",
            bridgePorts: "Ports Bridge",
            gateway: "Passerelle",
            address: "Adresse"
        },
        monitoring: {
            title: "Surveillance",
            subtitle: "Métriques d'infrastructure en temps réel",
            clusterOverview: "Vue du Cluster",
            cpuUsage: "Utilisation CPU",
            memoryUsage: "Utilisation Mémoire",
            diskUsage: "Utilisation Disque",
            networkTraffic: "Trafic Réseau",
            totalCores: "Total Cœurs",
            totalMemory: "Mémoire Totale",
            totalDisk: "Disque Total",
            runningInstances: "Instances Actives",
            lastHour: "Dernière Heure",
            last24h: "Dernières 24h",
            lastWeek: "Dernière Semaine",
            in: "Entrant",
            out: "Sortant"
        },
        settings: {
            title: "Paramètres",
            subtitle: "Personnalisez votre expérience Cloudy",
            language: "Langue",
            languageDesc: "Choisissez votre langue préférée",
            theme: "Thème",
            themeDesc: "Basculer entre le mode clair et sombre",
            dark: "Sombre",
            light: "Clair",
            system: "Système",
            saved: "Paramètres enregistrés"
        },
        security: {
            title: "Sécurité",
            subtitle: "Gérez les règles de pare-feu et les politiques de sécurité",
            firewallRules: "Règles de Pare-feu",
            addRule: "Ajouter une Règle",
            noRules: "Aucune règle de pare-feu trouvée",
            inbound: "Entrant",
            outbound: "Sortant",
            accept: "Accepter",
            drop: "Bloquer",
            reject: "Rejeter",
            protocol: "Protocole",
            port: "Port",
            source: "Source",
            destination: "Destination",
            enabled: "Activé",
            disabled: "Désactivé",
            cluster: "Cluster",
            allScopes: "Toutes les Portées"
        },
        actions: {
            start: "Démarrer",
            stop: "Arrêter",
            reset: "Redémarrer",
            shutdown: "Éteindre"
        }
    }
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        // Only access localStorage after mount (client-side)
        const stored = localStorage.getItem('language') as Language;
        if (stored && (stored === 'en' || stored === 'fr')) {
            setLanguageState(stored);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    const t = (key: string): string => {
        const keys = key.split('.');
        let value: any = translations[language];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key;
            }
        }

        return typeof value === 'string' ? value : key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
