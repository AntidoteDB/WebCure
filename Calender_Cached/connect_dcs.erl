#!/usr/bin/env escript
%%! -smp enable -sname erlshell -setcookie antidote
main(_Args) ->
  rpc:call(antidote@antidote1, inter_dc_manager, start_bg_processes, [stable]),
  rpc:call(antidote@antidote2, inter_dc_manager, start_bg_processes, [stable]),
  {ok, Desc1} = rpc:call(antidote@antidote1, inter_dc_manager, get_descriptor, []),
  {ok, Desc2} = rpc:call(antidote@antidote2, inter_dc_manager, get_descriptor, []),
  Descriptors = [Desc1, Desc2],
  rpc:call(antidote@antidote1, inter_dc_manager, observe_dcs_sync, [Descriptors]),
  rpc:call(antidote@antidote2, inter_dc_manager, observe_dcs_sync, [Descriptors]),
  io:format("Connection setup!").
