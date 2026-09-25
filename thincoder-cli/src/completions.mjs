/**
 * completions.mjs — `thincoder completion <shell>` shell 补全脚本发射（bash/zsh/fish）。
 * bin/thincoder.mjs case "completion" 直写段拆分（2026-09-08——500 行硬限触碰执行：
 * 段逐字迁出，脚本字节与既有输出一致）。
 */
export function printCompletion(shell) {
    if (shell === "bash") {
      process.stdout.write(`_thincoder() {
  local cur prev words cword
  _init_completion 2>/dev/null || { COMPREPLY=(); return; }
  cur="\${COMP_WORDS[COMP_CWORD]}"
  prev="\${COMP_WORDS[COMP_CWORD-1]}"
  case "\${COMP_WORDS[1]}" in
    chat)    COMPREPLY=( \\$(compgen -W "--auto" -- "\\$cur") ) ;;
    memory)
      case "\\$prev" in
        memory) COMPREPLY=( \\$(compgen -W "list search put remove sweep" -- "\\$cur") ) ;;
        list)   COMPREPLY=( \\$(compgen -W "--type=rule --type=knowledge --type=decision --type=pattern" -- "\\$cur") ) ;;
        put)    COMPREPLY=( \\$(compgen -W "--type= --title= --content= --tags=" -- "\\$cur") ) ;;
      esac ;;
    distill) COMPREPLY=( \\$(compgen -W "--yes --layer=" -- "\\$cur") ) ;;
    completion) COMPREPLY=( \\$(compgen -W "bash zsh fish" -- "\\$cur") ) ;;
    *)
      COMPREPLY=( \\$(compgen -W "tui chat acp memory sync reindex distill upgrade completion session -v --version -h --help" -- "\\$cur") ) ;;
  esac
}
complete -F _thincoder thincoder
`)
    } else if (shell === "zsh") {
      process.stdout.write(`#compdef thincoder

_thincoder() {
  local context state state_descr line
  typeset -A opt_args
  _arguments -C \\
    '1: :->cmd' \\
    '*:: :->args'

  case "\\$state" in
    cmd)
      _values 'command' \\
        'tui[Launch the interactive TUI]' \\
        'chat[One-shot agent run with tools]' \\
        'acp[Agent Client Protocol server for IDEs]' \\
        'memory[Manage long-term memory]' \\
        'sync[Sync team memory repo]' \\
        'reindex[Rebuild local index from markdown]' \\
        'distill[Extract knowledge from session transcript]' \\
        'upgrade[Update to latest version from npm]' \\
        'completion[Generate shell completion script]' \\
        'session[Session dir GC: session gc --dry-run|--confirm]'
      ;;
    args)
      case "\\$words[1]" in
        chat)    _arguments '--auto[Auto-approve all tool calls]' ;;
        memory)
          case "\\$words[2]" in
            list) _arguments '--type=[Filter by type]' ;;
            put)  _arguments '--type=[Entry type]' '--title=[Title]' '--content=[Content]' '--tags=[Space-separated tags]' ;;
            sweep) _arguments '--origin=[Origin path]' '--dry-run[Report only]' '--confirm[Apply writes]' ;;
          esac ;;
        distill) _arguments '--yes[Skip confirmation]' '--layer=[Layer filter]' ;;
        completion) _values 'shell' 'bash' 'zsh' 'fish' ;;
      esac ;;
  esac
}
_thincoder
`)
    } else if (shell === "fish") {
      process.stdout.write(`# thincoder completions for fish shell
complete -c thincoder -f

# Subcommands
complete -c thincoder -a tui      -d 'Launch the interactive TUI'
complete -c thincoder -a chat     -d 'One-shot agent run with tools'
complete -c thincoder -a memory   -d 'Manage long-term memory'
complete -c thincoder -a sync     -d 'Sync team memory repo'
complete -c thincoder -a reindex  -d 'Rebuild local index from markdown'
complete -c thincoder -a distill  -d 'Extract knowledge from session'
complete -c thincoder -a upgrade  -d 'Update to latest version'
complete -c thincoder -a completion -d 'Shell completion'
complete -c thincoder -a session -d 'Session dir GC (session gc --dry-run|--confirm)'
complete -c thincoder -a acp -d 'Agent Client Protocol server for IDEs'

# Flags
complete -c thincoder -s v -l version -d 'Print version'
complete -c thincoder -s h -l help    -d 'Print help'

# chat flags
complete -c thincoder -n '__fish_seen_subcommand_from chat' -l auto -d 'Auto-approve tool calls'

# memory subcommands
complete -c thincoder -n '__fish_seen_subcommand_from memory' -a list   -d 'List entries'
complete -c thincoder -n '__fish_seen_subcommand_from memory' -a search -d 'Search memory'
complete -c thincoder -n '__fish_seen_subcommand_from memory' -a put    -d 'Add entry'
complete -c thincoder -n '__fish_seen_subcommand_from memory' -a remove -d 'Remove entry'
complete -c thincoder -n '__fish_seen_subcommand_from memory' -a sweep  -d 'Sweep dead origins'

# memory list flags
complete -c thincoder -n '__fish_seen_subcommand_from memory; and __fish_seen_subcommand_from list' -l type -d 'Filter by type' -xa 'rule knowledge decision pattern'

# memory put flags
complete -c thincoder -n '__fish_seen_subcommand_from memory; and __fish_seen_subcommand_from put' -l type    -d 'Entry type'
complete -c thincoder -n '__fish_seen_subcommand_from memory; and __fish_seen_subcommand_from put' -l title   -d 'Title'
complete -c thincoder -n '__fish_seen_subcommand_from memory; and __fish_seen_subcommand_from put' -l content -d 'Content'
complete -c thincoder -n '__fish_seen_subcommand_from memory; and __fish_seen_subcommand_from put' -l tags    -d 'Space-separated tags'

# distill flags
complete -c thincoder -n '__fish_seen_subcommand_from distill' -l yes   -d 'Skip confirmation'
complete -c thincoder -n '__fish_seen_subcommand_from distill' -l layer -d 'Layer filter'

# completion shells
complete -c thincoder -n '__fish_seen_subcommand_from completion' -a bash -d 'Bash completions'
complete -c thincoder -n '__fish_seen_subcommand_from completion' -a zsh  -d 'Zsh completions'
complete -c thincoder -n '__fish_seen_subcommand_from completion' -a fish -d 'Fish completions'
`)
    }
}
